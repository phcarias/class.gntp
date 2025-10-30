const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const Frequencia = require('../models/FrequenciaModel');
const Nota = require('../models/NotaModel');
const User = require('../models/UserModel');
const Turma = require('../models/TurmaModel');
const path = require('path');
const fs = require('fs');
const emailController = require("../controllers/emailController");

// Função auxiliar para parsear datas do query
function getDateRange(req) {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // Padrão: início do mês
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1); // Padrão: fim do mês
    return { start, end };
}

// Relatório de Frequência de Turma (com período)
exports.getRelatorioFrequenciaTurma = async (req, res) => {
    const { turmaId } = req.params;
    const { start, end } = getDateRange(req);
    try {
        const pipeline = [
            { $match: { turma: new mongoose.Types.ObjectId(turmaId), data: { $gte: start, $lt: end } } },
            {
                $group: {
                    _id: '$aluno',
                    totalPresencas: { $sum: { $cond: [{ $eq: ['$status', 'presente'] }, 1, 0] } },
                    totalAulas: { $sum: 1 }
                }
            },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'aluno' } },
            { $unwind: '$aluno' },
            { $project: { aluno: '$aluno.name', frequencia: { $multiply: [{ $divide: ['$totalPresencas', '$totalAulas'] }, 100] } } }
        ];
        const data = await Frequencia.aggregate([
            { $match: { turma: turmaId, data: { $gte: start, $lt: end } } },
            {
                $group: {
                    _id: '$aluno',
                    totalPresencas: { $sum: { $cond: [{ $eq: ['$status', 'presente'] }, 1, 0] } },
                    totalAulas: { $sum: 1 }
                }
            }
        ]);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ msg: 'Erro ao gerar relatório de frequência de turma.', error });
    }
};

// Relatório de Frequência de Aluno (com período)
exports.getRelatorioFrequenciaAluno = async (req, res) => {
    const { alunoId } = req.params;
    const { start, end } = getDateRange(req);
    try {
        const pipeline = [
            { $match: { aluno: new mongoose.Types.ObjectId(alunoId), data: { $gte: start, $lt: end } } },
            {
                $group: {
                    _id: '$turma',
                    totalPresencas: { $sum: { $cond: [{ $eq: ['$status', 'presente'] }, 1, 0] } },
                    totalAulas: { $sum: 1 }
                }
            },
            { $lookup: { from: 'turmas', localField: '_id', foreignField: '_id', as: 'turma' } },
            { $unwind: '$turma' },
            { $project: { turma: '$turma.codigo', frequencia: { $multiply: [{ $divide: ['$totalPresencas', '$totalAulas'] }, 100] } } }
        ];
        const data = await Frequencia.aggregate(pipeline);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ msg: 'Erro ao gerar relatório de frequência de aluno.', error });
    }
};

// Relatório de Desempenho de Turma (notas médias por disciplina, com período)
exports.getRelatorioDesempenhoTurma = async (req, res) => {
    const { turmaId } = req.params;
    const { start, end } = getDateRange(req);
    try {
        const pipeline = [
            { $match: { turma: new mongoose.Types.ObjectId(turmaId), data: { $gte: start, $lt: end } } },
            { $group: { _id: { disciplina: '$disciplina', aluno: '$aluno' }, media: { $avg: '$nota' } } },
            { $lookup: { from: 'users', localField: '_id.aluno', foreignField: '_id', as: 'aluno' } },
            { $unwind: '$aluno' },
            { $project: { disciplina: '$_id.disciplina', aluno: '$aluno.name', media: 1 } }
        ];
        const data = await Nota.aggregate(pipeline);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ msg: 'Erro ao gerar relatório de desempenho de turma.', error });
    }
};

// Relatório de Desempenho de Aluno (médias por disciplina, com período)
exports.getRelatorioDesempenhoAluno = async (req, res) => {
    const { alunoId } = req.params;
    const { start, end } = getDateRange(req);
    try {
        const pipeline = [
            { $match: { aluno: new mongoose.Types.ObjectId(alunoId), data: { $gte: start, $lt: end } } },
            { $group: { _id: '$disciplina', media: { $avg: '$nota' } } },
            { $project: { disciplina: '$_id', media: 1, _id: 0 } }
        ];
        const data = await Nota.aggregate(pipeline);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ msg: 'Erro ao gerar relatório de desempenho de aluno.', error });
    }
};

// Relatório de Dados Gerais (turmas criadas, alunos, professores, datas)
exports.getRelatorioDadosGerais = async (req, res) => {
    try {
        const turmas = await Turma.find({})
            .populate('alunos', 'name email createdAt') // Popula alunos
            .populate('professores', 'name email createdAt') // Popula professores
            .select('codigo createdAt alunos professores disciplinas'); // Adicionado 'disciplinas'
        const data = turmas.map(turma => ({
            turma: turma.codigo,
            dataCriacaoTurma: turma.createdAt,
            disciplinas: turma.disciplinas || [], // Lista de disciplinas
            quantidadeAlunos: turma.alunos.length, // Quantidade de alunos
            quantidadeProfessores: turma.professores.length, // Quantidade de professores
            alunos: turma.alunos.map(aluno => ({
                nome: aluno.name,
                email: aluno.email,
                dataCriacaoAluno: aluno.createdAt
            })),
            professores: turma.professores.map(prof => ({
                nome: prof.name,
                email: prof.email,
                dataCriacaoProf: prof.createdAt
            }))
        }));
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ msg: 'Erro ao gerar relatório de dados gerais.', error });
    }
};

// Funções de export PDF (atualizadas para usar período)
exports.exportRelatorioFrequenciaTurmaPDF = async (req, res) => {
    const { turmaId } = req.params;
    const { start, end } = getDateRange(req);

    try {
        const frequencias = await Frequencia.find({
            turma: turmaId,
            data: { $gte: start, $lt: end }
        })
            .populate('aluno', 'name') // Popula o nome do aluno
            .sort({ data: 1 }); // Ordena por data

        const turma = await Turma.findById(turmaId);

        if (!turma) {
            return res.status(404).json({ msg: 'Turma não encontrada.' });
        }

        // Criação do PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Relatorio_Frequencia_Turma_${turma.codigo}.pdf"`);
        doc.pipe(res);

        // Título (negrito)
        doc.font('Times-Bold').fontSize(18).text(`Relatório de Frequência da Turma ${turma.codigo}`, { align: 'center' });
        doc.font('Times-Roman');
        doc.moveDown();

        // Informações da turma
        doc.fontSize(12).text(`Código da Turma: ${turma.codigo}`, { align: 'justify' });
        doc.text(`Período: ${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`, { align: 'justify' });
        doc.moveDown();

        // Tabela de frequência
        if (frequencias.length === 0) {
            doc.fontSize(12).text('Nenhum registro encontrado no período selecionado.', { align: 'center' });
        } else {
            const tableData = [
                ["Data", "Aluno", "Status", "Justificativa/Observação", "Data Registro"],
                ...frequencias.map(freq => {
                    const dataFormatada = new Date(freq.data).toLocaleDateString('pt-BR');
                    const status = freq.status === 'presente' ? 'Presente' : 'Falta';
                    const justificativa = freq.justificativa || 'N/A';
                    const dataRegistro = new Date(freq.createdAt).toLocaleDateString('pt-BR');
                    return [dataFormatada, freq.aluno?.name || 'N/A', status, justificativa, dataRegistro];
                })
            ];

            doc.table({
                headers: tableData[0],
                rows: tableData.slice(1),
                options: {
                    border: 1,
                    borderColor: "gray",
                    align: 'center'
                }
            });
        }

        doc.end();

    } catch (error) {
        console.error('Erro ao gerar relatório de frequência da turma:', error);
        res.status(500).json({ msg: 'Erro ao gerar relatório de frequência da turma.', error });
    }
};

// Função para exportar relatório de notas por aluno como PDF
exports.exportRelatorioNotasPDF = async (req, res) => {
    const { alunoId } = req.params;
    try {
        const aluno = await User.findById(alunoId).select('name email responsavelEmail');
        if (!aluno) return res.status(404).json({ msg: 'Aluno não encontrado.' });

        const pipeline = [
            { $match: { aluno: new mongoose.Types.ObjectId(alunoId) } },
            { $group: { _id: '$disciplina', media: { $avg: '$nota' } } },
            { $project: { disciplina: '$_id', media: 1, _id: 0 } }
        ];
        const data = await Nota.aggregate(pipeline);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.font('Times-Roman');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-notas-${aluno.name.replace(/\s+/g, '_')}.pdf"`);
        doc.pipe(res);

        // Header
        const logoPath = path.join(__dirname, '../public/img/logo_v2.jpeg');
        if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 30, { width: 80 });
        doc.fontSize(14).text('Class.GNTP', 65, 40, { align: 'center' });
        doc.moveDown(2);

        // Título
        doc.font('Times-Bold').fontSize(18).text(`Relatório de Notas de ${aluno.name}`, { align: 'center' });
        doc.font('Times-Roman');
        doc.moveDown();

        // Informações do aluno
        doc.fontSize(12).text(`Nome: ${aluno.name}`, { align: 'justify' });
        doc.text(`E-mail: ${aluno.email || 'N/A'}`, { align: 'justify' });
        doc.text(`E-mail do Responsável: ${aluno.responsavelEmail || 'N/A'}`, { align: 'justify' });
        doc.moveDown();

        // Tabela
        if (data.length === 0) {
            doc.fontSize(12).text('Nenhuma nota encontrada.', { align: 'center' });
        } else {
            const tableData = [["Disciplina", "Média"], ...data.map(item => [item.disciplina, item.media.toFixed(2)])];
            doc.table({
                defaultStyle: { border: 1, borderColor: "gray", align: 'center' },
                columnStyles: (i) => ({ align: 'center' }),
                rowStyles: (i) => ({ align: 'center' }),
                data: tableData,
            });
        }

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        const dataHoraImpressao = new Date().toLocaleString('pt-BR');
        doc.fontSize(10).text(`Página 1 de ${pageCount}`, 450, 750, { align: 'right' });
        doc.text(`Impresso em ${dataHoraImpressao}`, 50, 770, { align: 'left' });

        doc.end();
    } catch (error) {
        console.error('Erro ao gerar PDF de notas:', error);
        res.status(500).json({ msg: 'Erro ao gerar PDF de notas.', error: error.message });
    }
};


// Função para exportar relatório combinado de desempenho (frequência + notas) como PDF, agrupado por turma
exports.exportRelatorioDesempenhoPDF = async (req, res) => {
    try {
        // Frequências com aluno e turma populados
        const frequencias = await Frequencia.find({})
            .populate('aluno', '_id name')
            .populate('turma', '_id codigo')
            .sort({ data: 1 });

        // Map: turmaId -> { turmaId, turmaCodigo, alunos: Map<alunoId, { alunoId, alunoName, totalPresencas, totalAulas }> }
        const turmasMap = new Map();

        frequencias.forEach(freq => {
            const turmaId = freq.turma?._id?.toString() || 'sem-turma';
            const turmaCodigo = freq.turma?.codigo || 'Sem turma';
            const alunoId = freq.aluno?._id?.toString();
            const alunoName = freq.aluno?.name || 'Usuário não encontrado';
            if (!alunoId) return;

            if (!turmasMap.has(turmaId)) {
                turmasMap.set(turmaId, { turmaId, turmaCodigo, alunos: new Map() });
            }
            const turmaEntry = turmasMap.get(turmaId);

            if (!turmaEntry.alunos.has(alunoId)) {
                turmaEntry.alunos.set(alunoId, {
                    alunoId,
                    alunoName,
                    totalPresencas: 0,
                    totalAulas: 0
                });
            }
            const alunoEntry = turmaEntry.alunos.get(alunoId);
            alunoEntry.totalAulas += 1;

            // Atualizado: Verificar o campo `status` em vez de `presente`
            if (freq.status === 'presente') alunoEntry.totalPresencas += 1;
        });

        // Notas por aluno+turma (se o campo turma existir em Nota) e fallback por aluno
        const notasPorAlunoTurmaAgg = await Nota.aggregate([
            { $group: { _id: { aluno: '$aluno', turma: '$turma' }, mediaNotas: { $avg: '$nota' } } }
        ]);
        const notasPorAlunoAgg = await Nota.aggregate([
            { $group: { _id: '$aluno', mediaNotas: { $avg: '$nota' } } }
        ]);

        const notasAlunoTurmaMap = new Map(); // key: `${alunoId}|${turmaId}`
        notasPorAlunoTurmaAgg.forEach(n => {
            const alunoId = n._id?.aluno?.toString();
            const turmaId = n._id?.turma?.toString() || 'sem-turma';
            if (alunoId) notasAlunoTurmaMap.set(`${alunoId}|${turmaId}`, n.mediaNotas || 0);
        });

        const notasAlunoMap = new Map(); // key: alunoId
        notasPorAlunoAgg.forEach(n => {
            const alunoId = n._id?.toString();
            if (alunoId) notasAlunoMap.set(alunoId, n.mediaNotas || 0);
        });

        // Montagem do PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.font('Times-Roman');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio-desempenho-geral.pdf"');
        doc.pipe(res);

        // Header global
        const logoPath = path.join(__dirname, '../public/img/logo_v2.jpeg');
        if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 30, { width: 80 });
        doc.fontSize(14).text('Class.GNTP', 65, 40, { align: 'center' });
        doc.moveDown(2);
        doc.font('Times-Bold').fontSize(18).text('Relatório de Desempenho Geral (Frequência + Notas)', { align: 'center' });
        doc.font('Times-Roman');
        doc.moveDown();

        const turmasArray = Array.from(turmasMap.values());

        if (turmasArray.length === 0) {
            doc.fontSize(12).text('Nenhuma frequência/nota encontrada para compor o relatório.', { align: 'center' });
            const dataHoraImpressao = new Date().toLocaleString('pt-BR');
            doc.moveDown();
            doc.fontSize(10).text(`Impresso em ${dataHoraImpressao}`, 50, doc.y + 10, { align: 'left' });
            doc.end();
            return;
        }

        // Para cada turma, imprime uma tabela
        turmasArray.forEach((turmaEntry, idx) => {
            if (idx > 0) doc.addPage();

            // Header da turma
            doc.font('Times-Bold').fontSize(16).text(`Turma: ${turmaEntry.turmaCodigo}`, { align: 'left' });
            doc.moveDown(0.5);
            doc.font('Times-Roman').fontSize(11);

            // Linhas da tabela
            const linhas = Array.from(turmaEntry.alunos.values())
                .sort((a, b) => a.alunoName.localeCompare(b.alunoName))
                .map(alunoEntry => {
                    const frequencia = alunoEntry.totalAulas > 0
                        ? (alunoEntry.totalPresencas / alunoEntry.totalAulas) * 100
                        : 0;

                    const keyAlunoTurma = `${alunoEntry.alunoId}|${turmaEntry.turmaId}`;
                    const mediaNotas = (notasAlunoTurmaMap.has(keyAlunoTurma)
                        ? notasAlunoTurmaMap.get(keyAlunoTurma)
                        : (notasAlunoMap.get(alunoEntry.alunoId) ?? 0));

                    return [
                        alunoEntry.alunoName,
                        `${frequencia.toFixed(2)}%`,
                        Number(mediaNotas || 0).toFixed(2)
                    ];
                });

            const tableData = [
                ['Aluno', 'Frequência (%)', 'Média de Notas'],
                ...linhas
            ];

            // Tabela
            doc.table({
                defaultStyle: { border: 1, borderColor: 'gray', align: 'center' },
                columnStyles: (i) => ({ align: i === 0 ? 'left' : 'center' }),
                rowStyles: (i) => ({ align: 'center' }),
                datas: tableData, // compat com algumas versões
                data: tableData,
            });

            // Rodapé por turma
            const dataHoraImpressao = new Date().toLocaleString('pt-BR');
            doc.moveDown(0.5);
            doc.fontSize(10).text(`Impresso em ${dataHoraImpressao}`, { align: 'left' });
        });

        doc.end();
    } catch (error) {
        console.error('Erro ao gerar PDF de desempenho:', error);
        res.status(500).json({ msg: 'Erro ao gerar PDF de desempenho.', error: error.message });
    }
};

// Atualizar exportRelatorioFrequenciaAlunoPDF com conteúdo centralizado e justificado
exports.exportRelatorioFrequenciaAlunoPDF = async (req, res) => {
    const { alunoId } = req.params;
    const { start, end } = getDateRange(req);

    try {
        console.log('Iniciando busca de frequências para aluno:', alunoId);
        const frequencias = await Frequencia.find({
            aluno: alunoId,
            data: { $gte: start, $lt: end }
        })
            .populate('turma', 'codigo') // Popula o código da turma
            .sort({ data: 1 }); // Ordena por data

        console.log('Frequências encontradas:', frequencias.length, 'registros');

        const aluno = await User.findById(alunoId);
        if (!aluno) {
            console.log('Aluno não encontrado');
            return res.status(404).json({ msg: 'Aluno não encontrado.' });
        }
        console.log('Aluno encontrado:', aluno.name);

        // Criação do PDF
        console.log('Criando PDFDocument');
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-frequencia-${aluno.name.replace(/\s+/g, '_')}.pdf"`);
        
        console.log('Fazendo doc.pipe(res)');
        doc.pipe(res);

        // Título (negrito)
        console.log('Adicionando título');
        doc.font('Times-Bold').fontSize(18).text(`Relatório de Frequência de ${aluno.name}`, { align: 'center' });
        doc.font('Times-Roman');
        doc.moveDown();

        // Informações do aluno (justificadas)
        console.log('Adicionando informações do aluno');
        doc.fontSize(12).text(`Nome: ${aluno.name}`, { align: 'justify' });
        doc.text(`E-mail: ${aluno.email || 'N/A'}`, { align: 'justify' });
        doc.text(`E-mail do Responsável: ${aluno.responsavelEmail}`, { align: 'justify' });
        doc.moveDown();

        // Tabela de frequência (centralizada por padrão)
        if (frequencias.length === 0) {
            console.log('Nenhuma frequência, adicionando mensagem');
            doc.fontSize(12).text('Nenhum registro encontrado no período selecionado.', { align: 'center' });
        } else {
            console.log('Preparando dados da tabela');
            try {
                // Preparar dados da tabela
                const tableData = [
                    ["Data", "Turma", "Status", "Data Registro"],
                    ...frequencias.map(freq => {
                        console.log('Processando frequência:', freq);  // Log para depurar cada freq
                        const dataFormatada = new Date(freq.data).toLocaleDateString('pt-BR');
                        const status = freq.status === 'presente' ? 'Presente' : 'Falta';
                        const dataRegistro = new Date(freq.createdAt).toLocaleDateString('pt-BR');
                        const turmaCodigo = freq.turma?.codigo || 'N/A';
                        const alunoName = freq.aluno?.name || 'N/A';  // Verificar se populate funcionou
                        return [dataFormatada, turmaCodigo, status, dataRegistro];
                    })
                ];

                console.log('Dados da tabela preparados:', tableData.length, 'linhas');
                console.log('Adicionando tabela');
                // Adicionar tabela (centralizada, com texto das células centralizado)
                doc.table({
                    headers: tableData[0],
                    rows: tableData.slice(1),
                    options: {
                        border: 1,
                        borderColor: "gray",
                        align: 'center'
                    }
                });
            } catch (tableError) {
                console.error('Erro ao adicionar tabela:', tableError);
                return res.status(500).json({ msg: 'Erro ao gerar tabela do PDF.', error: tableError.message });
            }
        }

        console.log('Finalizando PDF');
        doc.end();

    } catch (error) {
        console.error('Erro ao gerar relatório de frequência do aluno:', error);
        res.status(500).json({ msg: 'Erro ao gerar relatório de frequência do aluno.', error });
    }
};

// Função para exportar relatório de desempenho de turma como PDF (faltava)
exports.exportRelatorioDesempenhoTurmaPDF = async (req, res) => {
    const { turmaId } = req.params;
    const { start, end } = getDateRange(req);
    try {
        const turma = await Turma.findById(turmaId).select('codigo');
        if (!turma) return res.status(404).json({ msg: 'Turma não encontrada.' });

        // Substituir agregação por:
        const frequencias = await Frequencia.find({ turma: new mongoose.Types.ObjectId(turmaId), data: { $gte: start, $lt: end } }).populate('aluno', 'name').sort({ data: 1 });

        // Agrupar em JS (similar ao desempenho)
        const freqMap = {};
        frequencias.forEach(freq => {
            const alunoId = freq.aluno?._id?.toString();
            const alunoName = freq.aluno?.name || 'Usuário não encontrado';
            if (!freqMap[alunoId]) {
                freqMap[alunoId] = { aluno: alunoName, totalPresencas: 0, totalAulas: 0, alunoId };
            }
            freqMap[alunoId].totalAulas += 1;
            if (freq.presente) freqMap[alunoId].totalPresencas += 1;
        });
        const data = Object.values(freqMap).map(item => ({
            aluno: item.aluno,
            frequencia: item.totalAulas > 0 ? (item.totalPresencas / item.totalAulas) * 100 : 0
        }));

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.font('Times-Roman');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-desempenho-turma-${turma.codigo}.pdf"`);
        doc.pipe(res);

        // Header
        const logoPath = path.join(__dirname, '../public/img/logo_v2.jpeg');
        if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 30, { width: 80 });
        doc.fontSize(14).text('Class.GNTP', 65, 40, { align: 'center' });
        doc.moveDown(2);

        // Título
        doc.font('Times-Bold').fontSize(18).text(`Relatório de Desempenho da Turma ${turma.codigo}`, { align: 'center' });
        doc.font('Times-Roman');
        doc.moveDown();

        // Tabela
        if (data.length === 0) {
            doc.fontSize(12).text('Nenhum dado encontrado.', { align: 'center' });
        } else {
            const tableData = [["Aluno", "Frequência (%)", "Média Notas"], ...data.map(item => [item.aluno, item.frequencia.toFixed(2)])];
            doc.table({
                defaultStyle: { border: 1, borderColor: "gray", align: 'center' },
                columnStyles: (i) => ({ align: 'center' }),
                rowStyles: (i) => ({ align: 'center' }),
                data: tableData,
            });
        }

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        const dataHoraImpressao = new Date().toLocaleString('pt-BR');
        doc.fontSize(10).text(`Página 1 de ${pageCount}`, 450, 750, { align: 'right' });
        doc.text(`Impresso em ${dataHoraImpressao}`, 50, 770, { align: 'left' });

        doc.end();
    } catch (error) {
        console.error('Erro ao gerar PDF de desempenho de turma:', error);
        res.status(500).json({ msg: 'Erro ao gerar PDF de desempenho de turma.', error: error.message });
    }
};

// Função para exportar relatório de desempenho de aluno como PDF (faltava)
exports.exportRelatorioDesempenhoAlunoPDF = async (req, res) => {
    const { alunoId } = req.params;
    const { start, end } = getDateRange(req);
    try {
        const aluno = await User.findById(alunoId).select('name email responsavelEmail');
        if (!aluno) return res.status(404).json({ msg: 'Aluno não encontrado.' });

        const pipeline = [
            { $match: { aluno: new mongoose.Types.ObjectId(alunoId), data: { $gte: start, $lt: end } } },
            { $group: { _id: '$disciplina', media: { $avg: '$nota' } } },
            { $project: { disciplina: '$_id', media: 1, _id: 0 } }
        ];
        const data = await Nota.aggregate(pipeline);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.font('Times-Roman');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-desempenho-aluno-${aluno.name.replace(/\s+/g, '_')}.pdf"`);
        doc.pipe(res);

        // Header
        const logoPath = path.join(__dirname, '../public/img/logo_v2.jpeg');
        if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 30, { width: 80 });
        doc.fontSize(14).text('Class.GNTP', 65, 40, { align: 'center' });
        doc.moveDown(2);

        // Título
        doc.font('Times-Bold').fontSize(18).text(`Relatório de Desempenho de ${aluno.name}`, { align: 'center' });
        doc.font('Times-Roman');
        doc.moveDown();

        // Informações do aluno
        doc.fontSize(12).text(`Nome: ${aluno.name}`, { align: 'justify' });
        doc.text(`E-mail: ${aluno.email || 'N/A'}`, { align: 'justify' });
        doc.text(`E-mail do Responsável: ${aluno.responsavelEmail || 'N/A'}`, { align: 'justify' });
        doc.moveDown();

        // Tabela
        if (data.length === 0) {
            doc.fontSize(12).text('Nenhum dado encontrado.', { align: 'center' });
        } else {
            const tableData = [["Disciplina", "Média"], ...data.map(item => [item.disciplina, item.media.toFixed(2)])];
            doc.table({
                defaultStyle: { border: 1, borderColor: "gray", align: 'center' },
                columnStyles: (i) => ({ align: 'center' }),
                rowStyles: (i) => ({ align: 'center' }),
                data: tableData,
            });
        }

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        const dataHoraImpressao = new Date().toLocaleString('pt-BR');
        doc.fontSize(10).text(`Página 1 de ${pageCount}`, 450, 750, { align: 'right' });
        doc.text(`Impresso em ${dataHoraImpressao}`, 50, 770, { align: 'left' });

        doc.end();
    } catch (error) {
        console.error('Erro ao gerar PDF de desempenho de aluno:', error);
        res.status(500).json({ msg: 'Erro ao gerar PDF de desempenho de aluno.', error: error.message });
    }
};

// Função para exportar relatório de dados gerais como PDF
exports.exportRelatorioDadosGeraisPDF = async (req, res) => {
    try {
        const turmas = await Turma.find({})
            .populate('alunos', 'name email createdAt')
            .populate('professores', 'name email createdAt')
            .select('codigo createdAt alunos professores disciplinas'); // Adicionado 'disciplinas'
        const data = turmas.map(turma => ({
            turma: turma.codigo,
            dataCriacaoTurma: turma.createdAt,
            disciplinas: turma.disciplinas || [],
            quantidadeAlunos: turma.alunos.length,
            quantidadeProfessores: turma.professores.length,
            alunos: turma.alunos.map(aluno => ({
                nome: aluno.name,
                email: aluno.email,
                dataCriacaoAluno: aluno.createdAt
            })),
            professores: turma.professores.map(prof => ({
                nome: prof.name,
                email: prof.email,
                dataCriacaoProf: prof.createdAt
            }))
        }));

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.font('Times-Roman');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio-dados-gerais.pdf"');
        doc.pipe(res);

        // Header
        const logoPath = path.join(__dirname, '../public/img/logo_v2.jpeg');
        if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 30, { width: 80 });
        doc.fontSize(14).text('Class.GNTP', 65, 40, { align: 'center' });
        doc.moveDown(2);

        // Título (negrito)
        doc.font('Times-Bold').fontSize(18).text('Relatório de Dados Gerais', { align: 'center' });
        doc.font('Times-Roman');
        doc.moveDown();

        // Conteúdo justificado
        data.forEach(turma => {
            // Turma em negrito
            doc.font('Times-Bold').fontSize(14).text(`Turma: ${turma.turma} (Criada em: ${new Date(turma.dataCriacaoTurma).toLocaleDateString('pt-BR')})`, { align: 'justify' });
            doc.font('Times-Roman');  // Volta para normal
            doc.moveDown(0.5);
            // Disciplinas
            doc.fontSize(12).text(`Disciplinas: ${turma.disciplinas.join(', ') || 'Nenhuma'}`, { align: 'justify' });
            doc.text(`Quantidade de Alunos: ${turma.quantidadeAlunos}`, { align: 'justify' });
            doc.text(`Quantidade de Professores: ${turma.quantidadeProfessores}`, { align: 'justify' });
            doc.moveDown(0.5);
            // Alunos
            doc.fontSize(12).text('Alunos:', { align: 'justify' });
            turma.alunos.forEach(aluno => {
                doc.text(`  - ${aluno.nome} (${aluno.email}) - Criado em: ${new Date(aluno.dataCriacaoAluno).toLocaleDateString('pt-BR')}`, { align: 'justify' });
                doc.moveDown(0.3);
            });
            // Professores
            doc.fontSize(12).text('Professores:', { align: 'justify' });
            turma.professores.forEach(prof => {
                doc.text(`  - ${prof.nome} (${prof.email}) - Criado em: ${new Date(prof.dataCriacaoProf).toLocaleDateString('pt-BR')}`, { align: 'justify' });
                doc.moveDown(0.3);
            });
            doc.moveDown();
        });

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        const dataHoraImpressao = new Date().toLocaleString('pt-BR');
        doc.fontSize(10).text(`Página 1 de ${pageCount}`, 450, 750, { align: 'right' });
        doc.text(`Impresso em ${dataHoraImpressao}`, 50, 770, { align: 'left' });

        doc.end();
    } catch (error) {
        console.error('Erro ao gerar PDF de dados gerais:', error);
        res.status(500).json({ msg: 'Erro ao gerar PDF de dados gerais.', error: error.message });
    }
};

// Função para exportar relatório de desempenho (frequência + notas) de um aluno, agrupado por turma
exports.exportRelatorioDesempenhoFrequenciaAlunoPDF = async (req, res) => {
    try {

        const { alunoId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(alunoId)) {
            return res.status(400).json({ msg: 'alunoId inválido.' });
        }

        // Frequências do aluno com turma e aluno populados
        const frequencias = await Frequencia.find({ aluno: alunoId })
            .populate('aluno', '_id name email responsavelEmail')
            .populate('turma', '_id codigo')
            .sort({ data: 1 });

        // Buscar dados do aluno (fallback caso não haja freq)
        let alunoInfo = frequencias[0]?.aluno || null;
        if (!alunoInfo) {
            alunoInfo = await User.findById(alunoId).select('name email responsavelEmail');
            if (!alunoInfo) return res.status(404).json({ msg: 'Aluno não encontrado.' });
        }

        // Agrupar frequência por turma
        const turmasMap = new Map(); // turmaId -> { turmaId, turmaCodigo, totalPresencas, totalAulas }
        frequencias.forEach(freq => {
            const turmaId = freq.turma?._id?.toString() || 'sem-turma';
            const turmaCodigo = freq.turma?.codigo || 'Sem turma';
            if (!turmasMap.has(turmaId)) {
                turmasMap.set(turmaId, { turmaId, turmaCodigo, totalPresencas: 0, totalAulas: 0 });
            }
            const t = turmasMap.get(turmaId);
            t.totalAulas += 1;
            if (freq.status === 'presente') t.totalPresencas += 1;
        });

        // Notas do aluno por turma (se existir campo turma em Nota) e fallback para média geral do aluno
        const notasPorTurmaAgg = await Nota.aggregate([
            { $match: { aluno: new mongoose.Types.ObjectId(alunoId) } },
            { $group: { _id: '$turma', mediaNotas: { $avg: '$nota' } } }
        ]);
        const notasPorTurmaMap = new Map(); // turmaId -> media
        notasPorTurmaAgg.forEach(n => {
            const turmaId = n._id ? n._id.toString() : 'sem-turma';
            notasPorTurmaMap.set(turmaId, n.mediaNotas || 0);
        });

        const notaGeralAgg = await Nota.aggregate([
            { $match: { aluno: new mongoose.Types.ObjectId(alunoId) } },
            { $group: { _id: '$aluno', mediaNotas: { $avg: '$nota' } } }
        ]);
        const mediaGeralAluno = notaGeralAgg[0]?.mediaNotas ?? 0;

        // PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.font('Times-Roman');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="desempenho-${alunoInfo.name.replace(/\s+/g, '_')}.pdf"`);
        doc.pipe(res);

        // Header global
        const logoPath = path.join(__dirname, '../public/img/logo_v2.jpeg');
        if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 30, { width: 80 });
        doc.fontSize(14).text('Class.GNTP', 65, 40, { align: 'center' });
        doc.moveDown(2);

        // Título + info do aluno
        doc.font('Times-Bold').fontSize(18).text(`Relatório de Desempenho e Frequencia de ${alunoInfo.name}`, { align: 'center' });
        doc.font('Times-Roman').moveDown();
        doc.fontSize(12).text(`Nome: ${alunoInfo.name}`, { align: 'justify' });
        doc.text(`E-mail: ${alunoInfo.email || 'N/A'}`, { align: 'justify' });
        doc.text(`E-mail do Responsável: ${alunoInfo.responsavelEmail || 'N/A'}`, { align: 'justify' });
        doc.moveDown();

        const turmasArray = Array.from(turmasMap.values()).sort((a, b) => a.turmaCodigo.localeCompare(b.turmaCodigo));

        if (turmasArray.length === 0) {
            doc.fontSize(12).text('Nenhuma frequência encontrada para este aluno.', { align: 'center' });
            const dataHoraImpressao = new Date().toLocaleString('pt-BR');
            doc.moveDown();
            doc.fontSize(10).text(`Impresso em ${dataHoraImpressao}`, 50, doc.y + 10, { align: 'left' });
            doc.end();
            return;
        }

        turmasArray.forEach((turmaEntry, idx) => {
            if (idx > 0) doc.addPage();

            // Header da turma
            doc.font('Times-Bold').fontSize(16).text(`Turma: ${turmaEntry.turmaCodigo}`, { align: 'left' });
            doc.moveDown(0.5);
            doc.font('Times-Roman').fontSize(11);

            const frequencia = turmaEntry.totalAulas > 0
                ? (turmaEntry.totalPresencas / turmaEntry.totalAulas) * 100
                : 0;

            const mediaTurma = notasPorTurmaMap.has(turmaEntry.turmaId)
                ? notasPorTurmaMap.get(turmaEntry.turmaId)
                : mediaGeralAluno;

            const tableData = [
                ['Aluno', 'Frequência (%)', 'Média de Notas'],
                [alunoInfo.name, `${frequencia.toFixed(2)}%`, Number(mediaTurma || 0).toFixed(2)]
            ];

            doc.table({
                defaultStyle: { border: 1, borderColor: 'gray', align: 'center' },
                columnStyles: (i) => ({ align: i === 0 ? 'left' : 'center' }),
                rowStyles: (i) => ({ align: 'center' }),
                data: tableData,
            });

            const dataHoraImpressao = new Date().toLocaleString('pt-BR');
            doc.moveDown(0.5);
            doc.fontSize(10).text(`Impresso em ${dataHoraImpressao}`, { align: 'left' });
        });

        doc.end();
    } catch (error) {
        console.error('Erro ao gerar PDF de desempenho do aluno:', error);
        res.status(500).json({ msg: 'Erro ao gerar PDF de desempenho do aluno.', error: error.message });
    }
};

exports.verificarFrequenciaENotasEEnviarAvisos = async (req, res) => {
    try {
        // Buscar turmas ativas
        const turmas = await Turma.find({ ativo: true }).populate('alunos', 'name email roleData');
        if (!turmas.length) {
            return res.status(200).json({ msg: 'Nenhuma turma ativa encontrada.' });
        }

        const avisosEnviados = { frequencia: [], notas: [] };

        for (const turma of turmas) {
            const limiteFaltas = turma.limiteFaltas || 25; // % máximo de faltas

            // Verificar frequência por aluno na turma
            const frequencias = await Frequencia.find({ turma: turma._id }).populate('aluno', 'name email roleData');
            const freqMap = {};
            frequencias.forEach(freq => {
                const alunoId = freq.aluno._id.toString();
                if (!freqMap[alunoId]) freqMap[alunoId] = { totalAulas: 0, totalPresencas: 0, aluno: freq.aluno };
                freqMap[alunoId].totalAulas += 1;
                if (freq.status === 'presente') freqMap[alunoId].totalPresencas += 1;
            });

            for (const [alunoId, data] of Object.entries(freqMap)) {
                const frequenciaPercentual = data.totalAulas > 0 ? (data.totalPresencas / data.totalAulas) * 100 : 0;
                if (frequenciaPercentual < limiteFaltas) {
                    // Enviar e-mail de aviso de frequência baixa
                    const aluno = data.aluno;
                    const responsavelEmail = aluno.roleData?.responsavelEmail;
                    const destinatarios = [aluno.email];
                    if (responsavelEmail) destinatarios.push(responsavelEmail);

                    // Para frequência baixa:
                    await emailController.sendWarnDesempenho({
                        username: 'administração - class.gntp',
                        para: destinatarios,
                        assunto: `Aviso: Frequência Baixa na Turma ${turma.codigo}`,
                        texto: `Olá ${aluno.name}, sua frequência é de ${frequenciaPercentual.toFixed(2)}%, abaixo de ${limiteFaltas}%.`,
                        html: '',  // Ignorado, pois usamos template interno
                        alunoName: aluno.name,
                        tipoAviso: 'frequência',
                        valor: `${frequenciaPercentual.toFixed(2)}%`,
                        limite: `${limiteFaltas}%`
                    });

                    avisosEnviados.frequencia.push({ aluno: aluno.name, turma: turma.codigo, frequencia: frequenciaPercentual });
                }
            }

            // Verificar notas por aluno (média geral)
            for (const aluno of turma.alunos) {
                const notas = await Nota.find({ aluno: aluno._id });
                if (notas.length > 0) {
                    const media = notas.reduce((sum, n) => sum + n.nota, 0) / notas.length;
                    if (media < 6) {
                        // Enviar e-mail de aviso de média baixa
                        const responsavelEmail = aluno.roleData?.responsavelEmail;
                        const destinatarios = [aluno.email];
                        if (responsavelEmail) destinatarios.push(responsavelEmail);

                        // Para média baixa:
                        await emailController.sendWarnDesempenho({
                            username: 'administração - class.gntp',
                            para: destinatarios,
                            assunto: `Aviso: Média Baixa na Turma ${turma.codigo}`,
                            texto: `Olá ${aluno.name}, sua média é de ${media.toFixed(2)}, abaixo de 6.`,
                            html: '',  // Ignorado
                            alunoName: aluno.name,
                            tipoAviso: 'nota',
                            valor: media.toFixed(2),
                            limite: '6'
                        });

                        avisosEnviados.notas.push({ aluno: aluno.name, turma: turma.codigo, media: media });
                    }
                }
            }
        }

        res.status(200).json({
            msg: 'Verificação concluída.',
            avisosEnviados
        });
    } catch (error) {
        console.error('Erro ao verificar frequência e notas:', error);
        res.status(500).json({ msg: 'Erro ao verificar frequência e notas.', error: error.message });
    }
};

