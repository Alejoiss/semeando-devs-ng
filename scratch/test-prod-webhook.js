const crypto = require('crypto');

// 1. Coloque a sua chave secreta DE PRODUÇÃO do Mercado Pago aqui
const secret = 'ea5520300a56755001ed0ab980f705b0638bef80b384f04dc5b5868edf4a23d3';

// A URL de produção da sua Edge Function
const webhookUrl = 'https://api.semeandodevs.com.br/functions/v1/mp-webhook';

const payload = {
    "action": "payment.created",
    "api_version": "v1",
    "data": {
        "id": "164363306336"
    },
    "date_created": "2026-06-16T14:01:44Z",
    "id": 133378638764,
    "live_mode": true,
    "type": "payment",
    "user_id": "64714323"
};

const rawBody = JSON.stringify(payload);

// Extração das variáveis para assinar
const dataId = payload.data.id;
const xRequestId = `manual-retry-${Date.now()}`;
const ts = Math.floor(Date.now() / 1000).toString(); // Timestamp atual em segundos

// O MESMO template que configuramos na function
const signedTemplate = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

// Gerar o hash usando a sua secret
const hmac = crypto.createHmac('sha256', secret);
hmac.update(signedTemplate);
const signatureHex = hmac.digest('hex');

const xSignature = `ts=${ts},v1=${signatureHex}`;

console.log('🔄 Disparando Webhook Fake para Produção...');
console.log(`URL: ${webhookUrl}`);
console.log(`x-request-id: ${xRequestId}`);
console.log(`x-signature: ${xSignature}\n`);

fetch(webhookUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-request-id': xRequestId,
        'x-signature': xSignature
    },
    body: rawBody
})
    .then(async res => {
        console.log(`Resposta [${res.status}]:`, await res.text());
    })
    .catch(err => {
        console.error('Erro na requisição:', err);
    });
