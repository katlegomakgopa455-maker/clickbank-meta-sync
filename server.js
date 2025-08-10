import axios from "axios";
import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

// Load environment variables
const CLICKBANK_API_KEY = process.env.CLICKBANK_API_KEY;
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

// ClickBank API URL
const CLICKBANK_URL = "https://api.clickbank.com/rest/1.3/sales/list";

// Meta Pixel API URL
const META_URL = `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events`;

// Fetch ClickBank sales
async function fetchClickbankSales() {
  try {
    const res = await axios.get(CLICKBANK_URL, {
      headers: { Authorization: `Bearer ${CLICKBANK_API_KEY}` }
    });
    return res.data;
  } catch (err) {
    console.error("❌ Error fetching ClickBank sales:", err.message);
    return [];
  }
}

// Send event to Meta
async function sendToMeta(sale) {
  try {
    const eventData = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          user_data: {
            em: [sale.emailHash]
          },
          custom_data: {
            currency: "USD",
            value: sale.amount
          }
        }
      ],
      access_token: META_ACCESS_TOKEN
    };

    await axios.post(META_URL, eventData);
    console.log(`✅ Sent sale of $${sale.amount} to Meta Pixel`);
  } catch (err) {
    console.error("❌ Error sending to Meta:", err.message);
  }
}

// Cron job: every hour
cron.schedule("0 * * * *", async () => {
  console.log("⏳ Fetching new sales from ClickBank...");
  const sales = await fetchClickbankSales();

  for (const sale of sales) {
    await sendToMeta(sale);
  }
});

console.log("🚀 ClickBank → Meta Pixel sync started...");
