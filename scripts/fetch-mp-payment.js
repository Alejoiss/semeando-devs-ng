const paymentId = '164363306336'; // Coloque o ID do pagamento aqui
// Coloque o seu Access Token de Produção do Mercado Pago aqui
const mlToken = 'APP_USR-1234567890-YOUR-ACCESS-TOKEN-HERE';

async function fetchPayment() {
    console.log(`Buscando pagamento ${paymentId} no Mercado Pago...`);
    try {
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                Authorization: `Bearer ${mlToken}`,
            },
        });

        if (!response.ok) {
            const body = await response.text();
            console.error(`Erro na API do MP: ${response.status} - ${body}`);
            return;
        }

        const data = await response.json();
        console.log('--- RETORNO DO PAGAMENTO ---');
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Erro ao buscar pagamento:', err);
    }
}

fetchPayment();
