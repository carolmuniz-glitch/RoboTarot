const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbvOB8raDACE0VtJoEaJicbrhbpjUDnhHSI9lm-nitrJLYaC_cs06LvTYG9Hk1mw_w_N/exec'; 
const SEU_NUMERO_WHATSAPP = '557199340412@c.us';

const PRECOS = {
    'sim ou não': '10',
    'pergunta objetiva': '20',
    '3 perguntas': '35',
    '5 perguntas': '50',
    'conselho': '25',
    'lenormand': '30',
    'afrodite': '50',
    'diabo': '65',
    'análise mensal': '35',
    'caminho': '25'
};

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false, // Abre a janelinha do navegador para você ver rodando sem erro
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--timeout=60000']
    }
});

client.on('qr', (qr) => {
    console.log('\nEscaneie o QR Code abaixo com o seu WhatsApp:\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\nTudo pronto! Bot conectado e operando no notebook. 🌙✨');
});

client.on('auth_failure', (msg) => {
    console.error('Falha na autenticação:', msg);
});

client.on('message', async (message) => {
    if (message.fromMe || message.isGroupMsg) return;

    const remoteJid = message.from;
    const textoMensagem = message.body;
    const textoLower = textoMensagem.toLowerCase();

    if (textoLower.includes('falar com a carol') || textoLower.includes('nao quero') || textoLower.includes('voltar ao início')) {
        await client.sendMessage(remoteJid, "Entendido! Se precisar de algo ou quiser retomar, é só me chamar. 💜✨");
        return;
    }

    if (textoLower.includes('valor') || textoLower.includes('valores') || textoLower.includes('orçamento') || textoLower.includes('quanto custa')) {
        const menuValores = 
`✨ *Valores dos Atendimentos com Oráculos* ✨

🌿 *Leituras com Tarot:*
- Pergunta de Sim ou Não: $10
- 1 Pergunta Objetiva: $20
- 3 Perguntas Objetivas: $35
- 5 Perguntas Objetivas: $50
- Conselho / Direcionamento: $25

🌿 *Leituras com Lenormand (Baralho Cigano):*
- Pergunta Objetiva: $30
- Templo de Afrodite: $50
- Templo do Diabo: $65
- Análise Mensal: $35
- Escolha de Caminho: $25

Para escolher, basta digitar o nome da tiragem desejada ou pedir *Falar com a Carol*. 💜`;

        await client.sendMessage(remoteJid, menuValores);
        return;
    }

    // Verifica se a cliente já escolheu uma tiragem
    let tiragemEncontrada = "";
    let valorEncontrado = "";

    for (let metodo in PRECOS) {
        if (textoLower.includes(metodo)) {
            tiragemEncontrada = metodo;
            valorEncontrado = PRECOS[metodo];
            break;
        }
    }

    if (tiragemEncontrada) {
        const mensagemPix = 
`Perfeito! Você escolheu a tiragem correspondente a: *${tiragemEncontrada.toUpperCase()}*.\n\n` +
`O valor do atendimento é de *$${valorEncontrado}*.\n\n` +
`Para garantirmos o seu horário e a abertura do campo energético, por favor realize o pagamento via PIX:\n\n` +
`🔑 *Chave PIX (E-mail):* \`carolmuniztarot@gmail.com\`\n\n` +
`Assim que realizar o pagamento, envie o seu **comprovante** aqui no chat para darmos início à sua tiragem! 🙏✨`;

        await client.sendMessage(remoteJid, mensagemPix);

        try {
            await axios.post(GOOGLE_SHEETS_URL, {
                telefone: remoteJid.split('@')[0],
                anamnese: textoMensagem,
                tiragem: tiragemEncontrada,
                status: "Aguardando Comprovante"
            });
        } catch (error) {
            console.log('Erro ao salvar na planilha:', error.message);
        }
        return;
    }

    // Fluxo padrão de boas-vindas e apresentação das opções caso não seja um comando direto
    const explicacaoMetodos = 
`Seja muito bem-vinda ao espaço do Oliver Moon! 🌙✨ 

Para eu te orientar da melhor forma com os oráculos, por favor me envie o seu nome, data de nascimento e o foco da sua questão. 

Aqui estão algumas das nossas principais ferramentas para iluminar o seu caminho:

🔮 *Tarot & Lenormand:*
- Pergunta de Sim ou Não ($10)
- Pergunta Objetiva ($20)
- 3 Perguntas Objetivas ($35)
- Conselho / Direcionamento ($25)
- Templo de Afrodite ($50)
- Templo do Diabo ($65)
- Análise Mensal ($35)
- Escolha de Caminho ($25)

Digite o nome da tiragem desejada para prosseguir para o pagamento ou digite *Falar com a Carol* a qualquer momento. 💜`;

    await client.sendMessage(remoteJid, explicacaoMetodos);
});

client.initialize();