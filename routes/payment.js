const express = require("express");
const cors = require("cors");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_API_SECRET);

const app = express();
app.use(cors());
app.use(express.json());

app.post("/payment", async (req, res) => {
  try {
    const stripeToken = req.body.stripeToken;
    const responseFromStripe = await stripe.charges.create({
      amount: 2000,
      currency: "eur",
      description: "produits description",
      source: stripeToken,
    });

    console.log(responseFromStripe);
    res.json(responseFromStripe.status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
