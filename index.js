const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxKMlDDZb4IN6985tF_Pdu5aovfe1ZLlrRRTDFmUKcguZ2sw4zlAsxifspNySFIEJTv/exec';
const SEU_NUMERO_WHATSAPP = '557199340412@c.us';

// Memória de sessão para acompanhar cada cliente
const sessoes = {};

const METODOS_INFO = {
    'sim ou não': {
        nome: 'Pergunta de Sim ou Não (Tarot)',
        valor: 'R$ 10',
        desc: 'Consulta rápida com 3 cartas para respostas diretas e objetivas, com direcionamento prático.'
    },
    'pergunta objetiva': {
        nome: 'Pergunta Objetiva (Tarot)',
        valor: 'R$ 20 (1 pergunta) | R$ 35 (3 perguntas) | R$ 50 (5 perguntas)',
        desc: 'Leitura com 6 cartas dividida em três fileiras para analisar o seu momento atual, a situação real e o resultado final com conselho.'
    },
    'conselho': {
        nome: 'Conselho / Direcionamento (Tarot)',
        valor: 'R$ 25',
        desc: 'Focado em guiar os seus próximos passos com 6 cartas, trazendo clareza estratégica para uma decisão ou momento de incerteza.'
    },
    'afrodite': {
        nome: 'Templo de Afrodite (Lenormand)',
        valor: 'R$ 50',
        desc: 'Focado em analisar o campo afetivo e amoroso, detalhando os sentimentos e os rumos de uma relação.'
    },
    'diabo': {
        nome: 'Templo do Diabo (Lenormand)',
        valor: 'R$ 65',
        desc: 'Investigação profunda de bloqueios, energias densas, sabotagens ou oposições ocultas em uma situação.'
    },
    'análise mensal': {
        nome: 'Análise Mensal (Lenormand)',
        valor: 'R$ 35',
        desc: 'Panorama completo com 7 cartas para antecipar os principais eventos, energias e tendências do seu mês.'
    },
    'caminho': {
        nome: 'Escolha de Caminho (Lenormand)',
        valor: 'R$ 25',
        desc: 'Análise comparativa para quem está dividida entre duas opções, mostrando os desdobramentos de cada escolha.'
    }
};

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

client.on('qr', (qr) => {
    console.log('Abra este link no navegador do seu computador para ver o QR Code:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
});

client.on('ready', () => {
    console.log('\nTudo pronto! Bot conectado e operando no notebook. 🌙✨');
});

client.on('auth_failure', (msg) => {
    console.error('Falha na autenticação:', msg);
});

// Função para registrar no Google Sheets
async function salvarNoSheets(remoteJid, anamnese, tiragem, status) {
    try {
        await axios.post(GOOGLE_SHEETS_URL, {
            telefone: remoteJid.split('@')[0],
            dataHora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Bahia' }),
            anamnese: anamnese,
            tiragem: tiragem,
            status: status
        });
    } catch (error) {
        console.log('Erro ao salvar na planilha:', error.message);
    }
}

client.on('message', async (message) => {
    if (message.fromMe || message.isGroupMsg) return;

    const remoteJid = message.from;
    const textoMensagem = message.body;
    const textoLower = textoMensagem.toLowerCase();

    // Inicializa a sessão se não existir
    if (!sessoes[remoteJid]) {
        sessoes[remoteJid] = { etapa: 'INICIO' };
    }

    // 1. Comando direto para falar com você
    if (textoLower.includes('falar com a carol') || textoLower.includes('falar com carol')) {
        sessoes[remoteJid] = { etapa: 'HUMANO' };
        await client.sendMessage(remoteJid, "Entendido! Estou chamando Carol para assumir a conversa. 🌿 Só um minutinho que logo ela te responde por aqui pessoalmente.");
        await client.sendMessage(SEU_NUMERO_WHATSAPP, `🚨 *Alerta de Atendimento!* O cliente ${remoteJid.split('@')[0]} pediu para falar diretamente com você.`);
        return;
    }

    // Se você assumiu a conversa, o bot para de responder para esse número
    if (sessoes[remoteJid].etapa === 'HUMANO') {
        return;
    }

    // Consulta de Tabela de Preços Geral
    if (textoLower.includes('valor') || textoLower.includes('valores') || textoLower.includes('orçamento') || textoLower.includes('quanto custa')) {
        const menuValores = 
`✨ *Valores dos Atendimentos com Oráculos* ✨

🌿 *Leituras com Tarot:*
- Pergunta de Sim ou Não: R$ 10
- 1 Pergunta Objetiva: R$ 20
- 3 Perguntas Objetivas: R$ 35
- 5 Perguntas Objetivas: R$ 50
- Conselho / Direcionamento: R$ 25

🌿 *Leituras com Lenormand (Baralho Cigano):*
- Pergunta Objetiva: R$ 30
- Templo de Afrodite: R$ 50
- Templo do Diabo: R$ 65
- Análise Mensal: R$ 35
- Escolha de Caminho: R$ 25

Para escolher, basta digitar o nome da tiragem desejada ou pedir *Falar com a Carol*. 💜`;

        await client.sendMessage(remoteJid, menuValores);
        return;
    }

    const estado = sessoes[remoteJid];

    // Fluxo do Bot
    switch (estado.etapa) {
        case 'INICIO': {
            // Verifica se o cliente já citou um método direto
            let metodoDireto = null;
            if (textoLower.includes('sim ou não') || textoLower.includes('sim ou nao')) metodoDireto = METODOS_INFO['sim ou não'];
            else if (textoLower.includes('afrodite')) metodoDireto = METODOS_INFO['afrodite'];
            else if (textoLower.includes('diabo')) metodoDireto = METODOS_INFO['diabo'];
            else if (textoLower.includes('análise mensal') || textoLower.includes('analise mensal')) metodoDireto = METODOS_INFO['análise mensal'];
            else if (textoLower.includes('caminho')) metodoDireto = METODOS_INFO['caminho'];
            else if (textoLower.includes('conselho')) metodoDireto = METODOS_INFO['conselho'];
            else if (textoLower.includes('pergunta objetiva')) metodoDireto = METODOS_INFO['pergunta objetiva'];

            if (metodoDireto) {
                sessoes[remoteJid] = { etapa: 'CONFIRMA_METODO', tiragem: metodoDireto.nome };
                const msgConfirmacao = `Você escolheu: *${metodoDireto.nome}*\n💰 *Valor:* ${metodoDireto.valor}\n📖 *Descrição:* ${metodoDireto.desc}\n\nGostaria de confirmar esse método?\n1 - Sim\n2 - Não\n3 - Mais opções`;
                await client.sendMessage(remoteJid, msgConfirmacao);
                return;
            }

            // Mensagem de Boas-Vindas Padrão
            sessoes[remoteJid] = { etapa: 'AGUARDANDO_DADOS' };
            const boasVindas = "Olá, seja muito bem-vindo(a)! 🌙 \nQue bom ter você aqui. Sou Carol Muniz, taróloga e oraculista. O destino te trouxe até aqui no momento certo. 🌿✨️\n\nPara começarmos, me diga o seu nome completo, data de nascimento e qual questão está pesando no seu coração ou exigindo uma resposta neste momento.";
            await client.sendMessage(remoteJid, boasVindas);
            break;
        }

        case 'AGUARDANDO_DADOS': {
            if (textoMensagem.length < 12) {
                await client.sendMessage(remoteJid, "Hmm, acho que não entendi muito bem! Para eu te ajudar da melhor forma com os oráculos, por favor me envie o seu nome completo, data de nascimento e o foco da sua consulta.✨\n\nSe preferir falar diretamente comigo para resolver algo específico, basta digitar *Falar com a Carol* que eu assumo a conversa por aqui.");
                return;
            }

            // Salva no Sheets
            await salvarNoSheets(remoteJid, textoMensagem, 'Em Análise', 'Dados Recebidos');

            // Identificação de contexto para sugestão
            let indicacao = "";
            let tiragemSugerida = "";

            if (textoLower.includes('amor') || textoLower.includes('namorado') || textoLower.includes('relacionamento') || textoLower.includes('ex') || textoLower.includes('casamento')) {
                tiragemSugerida = 'Templo de Afrodite (Lenormand)';
                indicacao = "Pelo que me contou, a leitura mais recomendada para o seu caso é o *Templo de Afrodite (Lenormand)*. Focado em analisar o campo afetivo e amoroso, detalhando os sentimentos e os rumos de uma relação.";
            } else if (textoLower.includes('financeiro') || textoLower.includes('dinheiro') || textoLower.includes('trabalho') || textoLower.includes('emprego') || textoLower.includes('carreira')) {
                tiragemSugerida = 'Pergunta Objetiva / Análise Mensal';
                indicacao = "Para a sua questão profissional/financeira, indico a *Pergunta Objetiva* ou a *Análise Mensal (Lenormand)*. Elas trazem clareza e direcionamento para os seus próximos passos na vida material.";
            } else {
                tiragemSugerida = 'Conselho / Direcionamento (Tarot)';
                indicacao = "Para essa questão, a leitura ideal é o *Conselho / Direcionamento (Tarot)*. Focado em guiar os seus próximos passos com 6 cartas, trazendo clareza estratégica para uma decisão ou momento de incerteza.";
            }

            sessoes[remoteJid] = { etapa: 'CONFIRMA_SUGESTAO', tiragem: tiragemSugerida };
            await client.sendMessage(remoteJid, `${indicacao}\n\nFaz sentido para você essa indicação?\n1 - Sim\n2 - Não\n3 - Mais opções`);
            break;
        }

        case 'CONFIRMA_SUGESTAO':
        case 'CONFIRMA_METODO': {
            if (textoLower === '1' || textoLower === 'sim') {
                sessoes[remoteJid] = { etapa: 'AGUARDANDO_COMPROVANTE', tiragem: estado.tiragem || 'Oráculo Escolhido' };
                await salvarNoSheets(remoteJid, textoMensagem, estado.tiragem || 'Oráculo Escolhido', 'Aguardando Comprovante');
                await client.sendMessage(remoteJid, "Perfeito! A chave-pix para pagamento é: *carolmuniztarot@gmail.com*\n\nAssim que efetuar, por favor, me envie o comprovante por aqui para darmos início!");
            } else if (textoLower === '2' || textoLower === '3' || textoLower === 'não' || textoLower === 'nao') {
                sessoes[remoteJid] = { etapa: 'ESCOLHENDO_CATALOGO' };
                const menuOpcoes = "Tudo bem! Temos outras ferramentas para iluminar o seu caminho:\n\n1 - Leitura com Tarot (Foco em Profundidade e Autoconhecimento)\n2 - Leitura com Lenormand/Baralho Cigano (Foco em Objetividade e Acontecimento)\n3 - Falar com a Carol\n\nDigite o número da opção desejada:";
                await client.sendMessage(remoteJid, menuOpcoes);
            } else {
                await client.sendMessage(remoteJid, "Por favor, responda com uma das opções:\n1 - Sim\n2 - Não\n3 - Mais opções");
            }
            break;
        }

        case 'ESCOLHENDO_CATALOGO': {
            if (textoLower === '1') {
                sessoes[remoteJid] = { etapa: 'SELECIONANDO_TAROT' };
                const catTarot = "🔮 *Leituras com Tarot:*\n1 - Pergunta de sim ou não (R$ 10)\n2 - Pergunta Objetiva (R$ 20)\n3 - Conselho/Direcionamento (R$ 25)\n\nDigite o número da opção desejada:";
                await client.sendMessage(remoteJid, catTarot);
            } else if (textoLower === '2') {
                sessoes[remoteJid] = { etapa: 'SELECIONANDO_LENORMAND' };
                const catLen = "🃏 *Leituras com Lenormand (Baralho Cigano):*\n1 - Pergunta Objetiva (R$ 30)\n2 - Templo de Afrodite (R$ 50)\n3 - Templo do Diabo (R$ 65)\n4 - Análise Mensal (R$ 35)\n5 - Escolha de Caminho (R$ 25)\n\nDigite o número da opção desejada:";
                await client.sendMessage(remoteJid, catLen);
            } else if (textoLower === '3') {
                sessoes[remoteJid] = { etapa: 'HUMANO' };
                await client.sendMessage(remoteJid, "Entendido! Estou chamando Carol para assumir a conversa. 🌿 Só um minutinho que logo ela te responde por aqui pessoalmente.");
                await client.sendMessage(SEU_NUMERO_WHATSAPP, `🚨 *Alerta de Atendimento!* O cliente ${remoteJid.split('@')[0]} pediu para falar diretamente com você.`);
            } else {
                await client.sendMessage(remoteJid, "Opção inválida. Digite 1 para Tarot, 2 para Lenormand ou 3 para Falar com a Carol.");
            }
            break;
        }

        case 'SELECIONANDO_TAROT': {
            let tiragem = 'Tarot';
            if (textoLower === '1') tiragem = 'Pergunta de Sim ou Não (Tarot)';
            else if (textoLower === '2') tiragem = 'Pergunta Objetiva (Tarot)';
            else if (textoLower === '3') tiragem = 'Conselho/Direcionamento (Tarot)';

            sessoes[remoteJid] = { etapa: 'AGUARDANDO_COMPROVANTE', tiragem: tiragem };
            await salvarNoSheets(remoteJid, textoMensagem, tiragem, 'Aguardando Comprovante');
            await client.sendMessage(remoteJid, `Opção selecionada: *${tiragem}*.\n\nA chave-pix para pagamento é: *carolmuniztarot@gmail.com*\n\nAssim que efetuar, por favor, me envie o comprovante por aqui.`);
            break;
        }

        case 'SELECIONANDO_LENORMAND': {
            let tiragem = 'Lenormand';
            if (textoLower === '1') tiragem = 'Pergunta Objetiva (Lenormand)';
            else if (textoLower === '2') tiragem = 'Templo de Afrodite (Lenormand)';
            else if (textoLower === '3') tiragem = 'Templo do Diabo (Lenormand)';
            else if (textoLower === '4') tiragem = 'Análise Mensal (Lenormand)';
            else if (textoLower === '5') tiragem = 'Escolha de Caminho (Lenormand)';

            sessoes[remoteJid] = { etapa: 'AGUARDANDO_COMPROVANTE', tiragem: tiragem };
            await salvarNoSheets(remoteJid, textoMensagem, tiragem, 'Aguardando Comprovante');
            await client.sendMessage(remoteJid, `Opção selecionada: *${tiragem}*.\n\nA chave-pix para pagamento é: *carolmuniztarot@gmail.com*\n\nAssim que efetuar, por favor, me envie o comprovante por aqui.`);
            break;
        }

        case 'AGUARDANDO_COMPROVANTE': {
            sessoes[remoteJid] = { etapa: 'FINALIZADO' };
            await salvarNoSheets(remoteJid, textoMensagem, estado.tiragem || 'Oráculo', 'Comprovante Recebido');
            await client.sendMessage(remoteJid, "Comprovante recebido com sucesso, muito obrigada! 🙏✨️ \nSua energia já está confirmada por aqui. O prazo para a entrega da sua leitura completa é de até *24 horas*. Assim que eu finalizar o atendimento, te envio tudo por aqui. Pode ficar com o coração tranquilo!");
            await client.sendMessage(SEU_NUMERO_WHATSAPP, `🔮 *Novo Comprovante Recebido!* O cliente ${remoteJid.split('@')[0]} enviou o comprovante para a tiragem: *${estado.tiragem || 'Oráculo'}*.`);
            break;
        }

        default: {
            sessoes[remoteJid] = { etapa: 'INICIO' };
            break;
        }
    }
});

client.initialize();