const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const Frequencia = require('../models/FrequenciaModel');
const Nota = require('../models/NotaModel');
const User = require('../models/UserModel');
const Turma = require('../models/TurmaModel');
const path = require('path');
const fs = require('fs');

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
            { $group: { _id: '$aluno', totalPresencas: { $sum: { $cond: [{ $eq: ['$presente', true] }, 1, 0] } }, totalAulas: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'aluno' } },
            { $unwind: '$aluno' },
            { $project: { aluno: '$aluno.name', frequencia: { $multiply: [{ $divide: ['$totalPresencas', '$totalAulas'] }, 100] } } }
        ];
        const data = await Frequencia.aggregate(pipeline);
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
            { $group: { _id: '$turma', totalPresencas: { $sum: { $cond: [{ $eq: ['$presente', true] }, 1, 0] } }, totalAulas: { $sum: 1 } } },
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
        const turma = await Turma.findById(turmaId).select('codigo');
        if (!turma) return res.status(404).json({ msg: 'Turma não encontrada.' });

        const pipeline = [
            { $match: { turma: new mongoose.Types.ObjectId(turmaId), data: { $gte: start, $lt: end } } },
            { $group: { _id: '$aluno', totalPresencas: { $sum: { $cond: [{ $eq: ['$presente', true] }, 1, 0] } }, totalAulas: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'aluno' } },
            { $unwind: '$aluno' },
            { $project: { aluno: '$aluno.name', frequencia: { $multiply: [{ $divide: ['$totalPresencas', '$totalAulas'] }, 100] } } }
        ];
        const data = await Frequencia.aggregate(pipeline);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.font('Times-Roman');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-frequencia-turma-${turma.codigo}.pdf"`);
        doc.pipe(res);

        // Header
        const logoPath = path.join(__dirname, '../public/img/logo_v2.jpeg');
        if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 30, { width: 80 });
        doc.fontSize(14).text('Class.GNTP', 65, 40, { align: 'center' });
        doc.moveDown(2);

        // Título
        doc.font('Times-Bold').fontSize(18).text(`Relatório de Frequência da Turma ${turma.codigo}`, { align: 'center' });
        doc.font('Times-Roman');  // Volta para normal
        doc.moveDown();

        // Tabela
        if (data.length === 0) {
            doc.fontSize(12).text('Nenhum dado encontrado.', { align: 'center' });
        } else {
            const tableData = [["Aluno", "Frequência (%)"], ...data.map(item => [item.aluno, item.frequencia.toFixed(2)])];
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
        console.error('Erro ao gerar PDF de frequência de turma:', error);
        res.status(500).json({ msg: 'Erro ao gerar PDF de frequência de turma.', error: error.message });
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

// Função para exportar relatório combinado de desempenho (frequência + notas) como PDF
exports.exportRelatorioDesempenhoPDF = async (req, res) => {
    try {
        // Buscar frequências com populate (incluir _id explicitamente)
        const frequencias = await Frequencia.find({}).populate('aluno', '_id name').sort({ data: 1 });


        // Agrupar frequência por aluno (em JS)
        const freqMap = {};
        frequencias.forEach(freq => {
            const alunoId = freq.aluno?._id?.toString();
            const alunoName = freq.aluno?.name || 'Usuário não encontrado';
            if (!freqMap[alunoId]) {
                freqMap[alunoId] = { aluno: alunoName, totalPresencas: 0, totalAulas: 0, alunoId };  // Adicionado alunoId
            }
            freqMap[alunoId].totalAulas += 1;
            if (freq.presente) freqMap[alunoId].totalPresencas += 1;
        });
        const freqData = Object.values(freqMap).map(item => ({
            _id: item.alunoId,  // Agora acessível
            aluno: item.aluno,
            frequencia: item.totalAulas > 0 ? (item.totalPresencas / item.totalAulas) * 100 : 0
        }));

        // Agregação para notas (mantido)
        const notasData = await Nota.aggregate([{ $group: { _id: '$aluno', mediaNotas: { $avg: '$nota' } } }]);

        // Combinar dados
        const combinedData = freqData.map(f => {
            const nota = notasData.find(n => n._id.toString() === f._id);
            return { aluno: f.aluno, frequencia: f.frequencia, mediaNotas: nota ? nota.mediaNotas : 0 };
        });

        // Logs para debug (remover após teste)

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.font('Times-Roman');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio-desempenho.pdf"');
        doc.pipe(res);

        // Header
        const logoPath = path.join(__dirname, '../public/img/logo_v2.jpeg');
        if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 30, { width: 80 });
        doc.fontSize(14).text('Class.GNTP', 65, 40, { align: 'center' });
        doc.moveDown(2);

        // Título
        doc.font('Times-Bold').fontSize(18).text('Relatório de Desempenho Geral', { align: 'center' });
        doc.font('Times-Roman');
        doc.moveDown();

        // Tabela
        if (combinedData.length === 0) {
            doc.fontSize(12).text('Nenhum dado encontrado.', { align: 'center' });
        } else {
            const tableData = [["Aluno", "Frequência (%)", "Média Notas"], ...combinedData.map(item => [item.aluno, item.frequencia.toFixed(2), item.mediaNotas.toFixed(2)])];
            doc.table({
                defaultStyle: { border: 1, borderColor: "gray", align: 'center', fontSize: 9 },
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
        console.error('Erro ao gerar PDF de desempenho:', error);
        res.status(500).json({ msg: 'Erro ao gerar PDF de desempenho.', error: error.message });
    }
};

// Atualizar exportRelatorioFrequenciaAlunoPDF com conteúdo centralizado e justificado
exports.exportRelatorioFrequenciaAlunoPDF = async (req, res) => {
    const { alunoId } = req.params;
    const { start, end } = getDateRange(req);
    try {
        // Buscar dados completos do aluno
        const aluno = await User.findById(alunoId).select('name email responsavelEmail');
        if (!aluno) {
            return res.status(404).json({ msg: 'Aluno não encontrado.' });
        }
        const alunoName = aluno.name.replace(/\s+/g, '_');

        // Buscar registros de frequência
        const frequencias = await Frequencia.find({
            aluno: new mongoose.Types.ObjectId(alunoId),
            data: { $gte: start, $lt: end }
        }).populate('turma', 'codigo').sort({ data: 1 });

        // Criar documento com margens e fonte
        const doc = new PDFDocument({
            margin: 50,  // Margens de 50px para espaço de header/footer
            size: 'A4'
        });
        doc.font('Times-Roman');  // Definir fonte Times New Roman para todo o documento

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-frequencia-${alunoName}.pdf"`);
        doc.pipe(res);

        // Header
        const logoPath = path.join(__dirname, '../public/img/logo_v2.jpeg');  // Caminho absoluto para a logo
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 30, { width: 80 });  // Logo no canto superior esquerdo
        }
        doc.fontSize(14).text('Class.GNTP', 65, 40, { align: 'center' });  // Nome do sistema no meio
        doc.moveDown(2);  // Espaço após header

        // Título (negrito)
        doc.font('Times-Bold').fontSize(18).text(`Relatório de Frequência de ${aluno.name}`, { align: 'center' });
        doc.font('Times-Roman');
        doc.moveDown();

        // Informações do aluno (justificadas)
        doc.fontSize(12).text(`Nome: ${aluno.name}`, { align: 'justify' });
        doc.text(`E-mail: ${aluno.email || 'N/A'}`, { align: 'justify' });
        doc.text(`E-mail do Responsável: ${aluno.responsavelEmail || 'N/A'}`, { align: 'justify' });
        doc.moveDown();

        // Tabela de frequência (centralizada por padrão)
        if (frequencias.length === 0) {
            doc.fontSize(12).text('Nenhum registro encontrado no período selecionado.', { align: 'center' });
        } else {
            // Preparar dados da tabela
            const tableData = [
                ["Data", "Turma", "Presença", "Justificativa/Observação", "Justificado", "Data Registro"],
                ...frequencias.map(freq => {
                    const dataFormatada = new Date(freq.data).toLocaleDateString('pt-BR');
                    const presente = freq.presente ? 'Presente' : 'Ausente';
                    const justificativa = freq.justificativa || 'N/A';
                    const justificado = freq.justificado ? 'Sim' : 'Não';
                    const dataRegistro = new Date(freq.dataRegistro).toLocaleDateString('pt-BR');
                    return [dataFormatada, freq.turma?.codigo || 'N/A', presente, justificativa, justificado, dataRegistro];
                })
            ];

            // Adicionar tabela (centralizada, com texto das células centralizado)
            doc.table({
                defaultStyle: { border: 1, borderColor: "gray", align: 'center' },  // Centraliza texto em todas as células
                columnStyles: (i) => ({
                    align: 'center',  // Centraliza texto em cada coluna
                    border: { left: i === 0 ? 2 : 1, right: i === 2 ? 2 : 1 },  // Bordas extras
                    borderColor: { left: i === 0 ? "black" : "gray", right: i === 2 ? "black" : "gray" }
                }),
                rowStyles: (i) => ({
                    align: 'center',  // Centraliza texto em cada linha
                    border: { top: i === 0 ? 2 : 1, bottom: i === tableData.length - 1 ? 2 : 1 },
                    borderColor: { top: i === 0 ? "black" : "gray", bottom: i === tableData.length - 1 ? "black" : "gray" }
                }),
                data: tableData,
            });

            // Resumo (justificado)
            const totalAulas = frequencias.length;
            const totalPresentes = frequencias.filter(f => f.presente).length;
            const frequenciaGeral = totalAulas > 0 ? ((totalPresentes / totalAulas) * 100).toFixed(2) : 0;
            doc.moveDown();
            doc.fontSize(12).text(`Resumo: Total de Aulas: ${totalAulas}, Presentes: ${totalPresentes}, Frequência Geral: ${frequenciaGeral}%`, { align: 'justify' });
        }

        // Footer (adicionado antes de doc.end())
        const pageCount = doc.bufferedPageRange().count;  // Total de páginas
        doc.fontSize(10).text(`Página 1 de ${pageCount}`, 450, 750, { align: 'right' });  // Posição inferior direita

        doc.end();
    } catch (error) {
        console.error('Erro ao gerar PDF de frequência de aluno:', error);
        res.status(500).json({ msg: 'Erro ao gerar PDF de frequência de aluno.', error: error.message });
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