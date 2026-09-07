const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// COLE AQUI A SUA URL DA NOVA IMPLANTAÇÃO DO GOOGLE SHEETS:
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycby8vCH2N0bS7L7n5658u1f6oTDKH03MZzLzyHEJZjWGc4nIqnd0L5uLHYcoPqbplaQ/exec'; 
const SEU_NUMERO_WHATSAPP = '557199340412@c.us';

const sessoes = {};

const METODOS_INFO = {
    'sim ou não': {
        nome: 'Pergunta de Sim ou Não (Tarot)',
        valor: 'R$ 10',
        desc: 'Consulta rápida com 3 cartas para respostas diretas e objetivas, oferecendo um direcionamento prático para a sua dúvida.'
    },
    'pergunta objetiva': {
        nome: 'Pergunta Objetiva (Tarot)',
        valor: 'R$ 20',
        desc: 'Leitura com 6 cartas dividida em três fileiras para analisar o seu momento atual, a situação real e o resultado final com conselho.'
    },
    'conselho': {
        nome: 'Conselho / Direcionamento (Tarot)',
        valor: 'R$ 25',
        desc: 'Focado em guiar os seus próximos passos com 6 cartas, trazendo clareza estratégica para uma decisão importante ou momento de incerteza.'
    },
    'afrodite': {
        nome: 'Templo de Afrodite (Lenormand)',
        valor: 'R$ 50',
        desc: 'Análise profunda e completa do campo afetivo e amoroso, detalhando os pensamentos, sentimentos e os rumos da relação para ambos.'
    },
    'diabo': {
        nome: 'Templo do Diabo (Lenormand)',
        valor: 'R$ 65',
        desc: 'Investigação profunda de bloqueios, energias densas, ocultas, autossabotagens ou oposições que possam estar atrapalhando o seu caminho.'
    },
    'análise mensal': {
        nome: 'Análise Mensal (Lenormand)',
        valor: 'R$ 35',
        desc: 'Panorama completo com 7 cartas para antecipar os principais acontecimentos, energias e tendências do seu mês.'
    },
    'caminho': {
        nome: 'Escolha de Caminho (Lenormand)',
        valor: 'R$ 25',
        desc: 'Análise comparativa para quem está dividida entre duas opções, mostrando os desdobramentos e consequências de cada escolha.'
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
    console.log('Abra este link no navegador para ver o QR Code:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
});

client.on('ready', () => {
    console.log('\nTudo pronto! Bot conectado e operando no notebook. 🌙✨');
});

// Função para atualizar/salvar na planilha na ordem correta
async function salvarNoSheets(remoteJid, dados) {
    try {
        await axios.post(GOOGLE_SHEETS_URL, {
            telefone: remoteJid.split('@')[0],
            dataHora: new Date().toLocaleString('pt-BR', { timeZone: 'America/Bahia' }),
            nome: dados.nome || '',
            anamnese: dados.anamnese || '',
            tiragem: dados.tiragem || '',
            comprovante: dados.comprovante || 'Aguardando comprovante',
            valor: dados.valor || '',
            status: dados.status || 'Em análise'
        });
    } catch (error) {
        console.log('Erro ao salvar na planilha:', error.message);
    }
}

function mudarEtapa(remoteJid, novaEtapa, dadosExtra = {}) {
    if (!sessoes[remoteJid]) {
        sessoes[remoteJid] = { etapa: 'INICIO', historico: [] };
    }
    if (sessoes[remoteJid].etapa && sessoes[remoteJid].etapa !== novaEtapa) {
        sessoes[remoteJid].historico.push(sessoes[remoteJid].etapa);
    }
    sessoes[remoteJid].etapa = novaEtapa;
    Object.assign(sessoes[remoteJid], dadosExtra);
}

function voltarEtapa(remoteJid) {
    if (sessoes[remoteJid] && sessoes[remoteJid].historico.length > 0) {
        sessoes[remoteJid].etapa = sessoes[remoteJid].historico.pop();
        return true;
    }
    return false;
}

client.on('message', async (message) => {
    if (message.fromMe || message.isGroupMsg) return;

    const remoteJid = message.from;
    const textoMensagem = message.body;
    const textoLower = textoMensagem.toLowerCase().trim();

    if (!sessoes[remoteJid]) {
        sessoes[remoteJid] = { etapa: 'INICIO', historico: [] };
    }

    if (sessoes[remoteJid].etapa === 'HUMANO') {
        if (textoLower === 'voltar' || textoLower === '0') {
            voltarEtapa(remoteJid);
            await client.sendMessage(remoteJid, "Voltando para o atendimento automático com nossos oráculos. 🔮✨");
            return;
        } else {
            return;
        }
    }

    if (textoLower.includes('falar com a carol') || textoLower.includes('falar com carol')) {
        mudarEtapa(remoteJid, 'HUMANO');
        await client.sendMessage(remoteJid, "Entendido! Estou chamando a Carol para assumir a conversa. 🌿 Só um minutinho que logo ela te responde por aqui pessoalmente.\n\n*(Se quiser voltar ao menu automático a qualquer momento, digite 0 ou voltar!)*");
        await client.sendMessage(SEU_NUMERO_WHATSAPP, `🚨 *Alerta de Atendimento!* O cliente ${remoteJid.split('@')[0]} pediu para falar diretamente com você.`);
        return;
    }

    if (textoLower.includes('como funciona') || textoLower.includes('como e feito') || textoLower.includes('como é feito') || textoLower.includes('funciona como')) {
        const explicacaoFuncionamento = 
`✨ *Como funcionam as leituras?* ✨

🌿 Todas as consultas são realizadas de forma individual e personalizada.
📸 Após a confirmação do pagamento, sua tiragem é gravada e entregue diretamente aqui no seu WhatsApp via **áudios explicativos + fotos detalhadas das cartas reveladas**.

⏳ O prazo de entrega é de até **24 horas** após o envio do comprovante.

Se quiser ver as tiragens disponíveis e valores, digite *valores* ou me envie seu nome, data de nascimento e sua questão! 💜`;

        await client.sendMessage(remoteJid, explicacaoFuncionamento);
        return;
    }

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

Para escolher, basta digitar o nome da tiragem desejada, digitar *0* para voltar ou pedir *Falar com a Carol*. 💜`;

        await client.sendMessage(remoteJid, menuValores);
        return;
    }

    if (textoLower === 'voltar' || textoLower === '0') {
        const conseguiuVoltar = voltarEtapa(remoteJid);
        if (!conseguiuVoltar) {
            sessoes[remoteJid].etapa = 'INICIO';
        }
    }

    const estado = sessoes[remoteJid];

    switch (estado.etapa) {
        case 'INICIO': {
            let metodoDireto = null;
            if (textoLower.includes('sim ou não') || textoLower.includes('sim ou nao')) metodoDireto = METODOS_INFO['sim ou não'];
            else if (textoLower.includes('afrodite')) metodoDireto = METODOS_INFO['afrodite'];
            else if (textoLower.includes('diabo')) metodoDireto = METODOS_INFO['diabo'];
            else if (textoLower.includes('análise mensal') || textoLower.includes('analise mensal')) metodoDireto = METODOS_INFO['análise mensal'];
            else if (textoLower.includes('caminho')) metodoDireto = METODOS_INFO['caminho'];
            else if (textoLower.includes('conselho')) metodoDireto = METODOS_INFO['conselho'];
            else if (textoLower.includes('pergunta objetiva')) metodoDireto = METODOS_INFO['pergunta objetiva'];

            if (metodoDireto) {
                mudarEtapa(remoteJid, 'CONFIRMA_METODO', { tiragem: metodoDireto.nome, valor: metodoDireto.valor, desc: metodoDireto.desc });
                const msgConfirmacao = `🔮 *${metodoDireto.nome}*\n\n📖 *Como funciona esta tiragem:* ${metodoDireto.desc}\n💰 *Investimento:* ${metodoDireto.valor}\n\nDeseja confirmar essa escolha?\n1 - Sim, quero essa\n2 - Não, ver outras opções\n0 - Voltar`;
                await client.sendMessage(remoteJid, msgConfirmacao);
                return;
            }

            mudarEtapa(remoteJid, 'AGUARDANDO_DADOS');
            const boasVindas = "Olá, seja muito bem-vindo(a)! 🌙 \nQue bom ter você aqui. Sou Carol Muniz, taróloga e oraculista. O destino te trouxe até aqui no momento certo. 🌿✨️\n\nPara começarmos, me diga o seu nome completo, data de nascimento e qual questão está pesando no seu coração ou exigindo uma resposta neste momento.";
            await client.sendMessage(remoteJid, boasVindas);
            break;
        }

        case 'AGUARDANDO_DADOS': {
            if (textoMensagem.length < 12) {
                await client.sendMessage(remoteJid, "Hmm, acho que não entendi muito bem! Para eu te ajudar da melhor forma com os oráculos, por favor me envie o seu nome completo, data de nascimento e o foco da sua consulta.✨\n\nSe preferir falar diretamente comigo para resolver algo específico, basta digitar *Falar com a Carol*.");
                return;
            }

            // Tenta extrair o primeiro nome ou usa a mensagem inteira como nome provisório/anamnese
            const partesNome = textoMensagem.split('\n')[0].split(' ');
            const nomeCliente = partesNome.slice(0, 2).join(' ');

            sessoes[remoteJid].nome = nomeCliente;
            sessoes[remoteJid].anamnese = textoMensagem;

            let infoMetodo = METODOS_INFO['conselho'];
            if (textoLower.includes('amor') || textoLower.includes('namorado') || textoLower.includes('relacionamento') || textoLower.includes('ex') || textoLower.includes('casamento')) {
                infoMetodo = METODOS_INFO['afrodite'];
            } else if (textoLower.includes('financeiro') || textoLower.includes('dinheiro') || textoLower.includes('trabalho') || textoLower.includes('emprego') || textoLower.includes('carreira')) {
                infoMetodo = METODOS_INFO['pergunta objetiva'];
            }

            mudarEtapa(remoteJid, 'CONFIRMA_SUGESTAO', { tiragem: infoMetodo.nome, valor: infoMetodo.valor, desc: infoMetodo.desc, nome: nomeCliente, anamnese: textoMensagem });
            
            await salvarNoSheets(remoteJid, {
                nome: nomeCliente,
                anamnese: textoMensagem,
                tiragem: infoMetodo.nome,
                valor: infoMetodo.valor,
                status: 'Em análise',
                comprovante: 'Aguardando comprovante'
            });

            const msgSugestao = `Pelo que me contou, a leitura mais recomendada para o seu caso é o *${infoMetodo.nome}*.\n\n📖 *Como funciona:* ${infoMetodo.desc}\n💰 *Investimento:* ${infoMetodo.valor}\n\nFaz sentido para você essa indicação?\n1 - Sim, quero essa\n2 - Não, ver outras opções\n0 - Voltar`;
            await client.sendMessage(remoteJid, msgSugestao);
            break;
        }

        case 'CONFIRMA_SUGESTAO':
        case 'CONFIRMA_METODO': {
            if (textoLower === '1' || textoLower === 'sim') {
                mudarEtapa(remoteJid, 'AGUARDANDO_COMPROVANTE', { tiragem: estado.tiragem, valor: estado.valor });
                
                await salvarNoSheets(remoteJid, {
                    nome: estado.nome || '',
                    anamnese: estado.anamnese || '',
                    tiragem: estado.tiragem,
                    valor: estado.valor,
                    status: 'Pendente',
                    comprovante: 'Aguardando comprovante'
                });
                
                const msgPix = `Perfeito! ✨\n\n📌 *Resumo da Escolha:*\n• *Leitura:* ${estado.tiragem}\n• *Valor:* ${estado.valor}\n\n🔑 *Chave Pix (E-mail):*\n*carolmuniztarot@gmail.com*\n\nAssim que efetuar o pagamento, por favor envie o **comprovante por aqui** para darmos início!`;

                await client.sendMessage(remoteJid, msgPix);
            } else if (textoLower === '2' || textoLower === 'não' || textoLower === 'nao') {
                mudarEtapa(remoteJid, 'ESCOLHENDO_CATALOGO');
                const menuOpcoes = "Tudo bem! Temos outras ferramentas para iluminar o seu caminho:\n\n1 - Leitura com Tarot\n2 - Leitura com Lenormand (Baralho Cigano)\n3 - Falar com a Carol\n0 - Voltar\n\nDigite o número da opção desejada:";
                await client.sendMessage(remoteJid, menuOpcoes);
            } else {
                await client.sendMessage(remoteJid, "Por favor, escolha uma opção válida:\n1 - Sim, quero essa\n2 - Não, ver outras opções\n0 - Voltar");
            }
            break;
        }

        case 'ESCOLHENDO_CATALOGO': {
            if (textoLower === '1') {
                mudarEtapa(remoteJid, 'SELECIONANDO_TAROT');
                const catTarot = "🔮 *Leituras com Tarot:*\n1 - Pergunta de sim ou não\n2 - Pergunta Objetiva\n3 - Conselho/Direcionamento\n0 - Voltar\n\nDigite o número da opção desejada para ver detalhes e valor:";
                await client.sendMessage(remoteJid, catTarot);
            } else if (textoLower === '2') {
                mudarEtapa(remoteJid, 'SELECIONANDO_LENORMAND');
                const catLen = "🃏 *Leituras com Lenormand (Baralho Cigano):*\n1 - Pergunta Objetiva\n2 - Templo de Afrodite\n3 - Templo do Diabo\n4 - Análise Mensal\n5 - Escolha de Caminho\n0 - Voltar\n\nDigite o número da opção desejada para ver detalhes e valor:";
                await client.sendMessage(remoteJid, catLen);
            } else if (textoLower === '3') {
                mudarEtapa(remoteJid, 'HUMANO');
                await client.sendMessage(remoteJid, "Entendido! Estou chamando a Carol para assumir a conversa. 🌿 Só um minutinho que logo ela te responde por aqui pessoalmente.\n\n*(Caso queira voltar ao menu automático a qualquer momento, basta digitar 0 ou voltar!)*");
                await client.sendMessage(SEU_NUMERO_WHATSAPP, `🚨 *Alerta de Atendimento!* O cliente ${remoteJid.split('@')[0]} pediu para falar diretamente com você.`);
            } else {
                await client.sendMessage(remoteJid, "Opção inválida. Digite 1 para Tarot, 2 para Lenormand, 3 para Falar com a Carol ou 0 para Voltar.");
            }
            break;
        }

        case 'SELECIONANDO_TAROT': {
            let info = METODOS_INFO['pergunta objetiva'];
            if (textoLower === '1') info = METODOS_INFO['sim ou não'];
            else if (textoLower === '2') info = METODOS_INFO['pergunta objetiva'];
            else if (textoLower === '3') info = METODOS_INFO['conselho'];

            mudarEtapa(remoteJid, 'CONFIRMA_METODO', { tiragem: info.nome, valor: info.valor, desc: info.desc });
            const msgDet = `🔮 *${info.nome}*\n\n📖 *Como funciona:* ${info.desc}\n💰 *Investimento:* ${info.valor}\n\nDeseja confirmar essa escolha?\n1 - Sim, quero essa\n2 - Não, ver outras opções\n0 - Voltar`;
            await client.sendMessage(remoteJid, msgDet);
            break;
        }

        case 'SELECIONANDO_LENORMAND': {
            let info = METODOS_INFO['pergunta objetiva'];
            if (textoLower === '1') info = METODOS_INFO['pergunta objetiva'];
            else if (textoLower === '2') info = METODOS_INFO['afrodite'];
            else if (textoLower === '3') info = METODOS_INFO['diabo'];
            else if (textoLower === '4') info = METODOS_INFO['análise mensal'];
            else if (textoLower === '5') info = METODOS_INFO['caminho'];

            mudarEtapa(remoteJid, 'CONFIRMA_METODO', { tiragem: info.nome, valor: info.valor, desc: info.desc });
            const msgDet = `🃏 *${info.nome}*\n\n📖 *Como funciona:* ${info.desc}\n💰 *Investimento:* ${info.valor}\n\nDeseja confirmar essa escolha?\n1 - Sim, quero essa\n2 - Não, ver outras opções\n0 - Voltar`;
            await client.sendMessage(remoteJid, msgDet);
            break;
        }

        case 'AGUARDANDO_COMPROVANTE': {
            mudarEtapa(remoteJid, 'FINALIZADO');
            
            await salvarNoSheets(remoteJid, {
                nome: estado.nome || '',
                anamnese: estado.anamnese || '',
                tiragem: estado.tiragem || 'Oráculo',
                comprovante: 'Recebido / Enviado',
                valor: estado.valor || '',
                status: 'Pendente'
            });
            
            const msgFinal = "Comprovante recebido com sucesso, muito obrigada! 🙏✨️\n\nSua energia já está confirmada por aqui. O prazo para a entrega da sua leitura completa é de até **24 horas**. Ela será gravada com todo carinho e enviada diretamente aqui no seu WhatsApp através de **áudios explicativos + fotos das cartas**.\n\nPode ficar com o coração tranquilo!";
            await client.sendMessage(remoteJid, msgFinal);
            await client.sendMessage(SEU_NUMERO_WHATSAPP, `🔮 *Novo Comprovante Recebido!* O cliente ${estado.nome || remoteJid.split('@')[0]} enviou o comprovante para a tiragem: *${estado.tiragem || 'Oráculo'}* (${estado.valor || ''}).`);
            break;
        }

        default: {
            sessoes[remoteJid] = { etapa: 'INICIO', historico: [] };
            break;
        }
    }
});

client.initialize();