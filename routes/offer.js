const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const isAuthenticated = require("../middlewares/isAuthenticated");
const Offer = require("../models/Offer");
const convertToBase64 = require("../utils/convertToBase64");

// J'utilise les middlewares isAuthenticated et fileUpload()
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // Destructuring des clefs du body
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      // Je récupère la photo dans la clef suivante
      const picture = req.files.picture;
      // Upload de mon image sur cloudinary, la réponse de ce dernier sera dans result
      const result = await cloudinary.uploader.upload(
        convertToBase64(picture),
        { folder: "/vinted/offers" }
      );
      // Création de ma nouvelle offre
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: Number(price),
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ÉTAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        product_image: result,
        // Ici, je me mon user entier, du moment que cet objet contient une clef _id, ce sera compris par mongoose comme une référence
        owner: req.user,
      });

      await newOffer.save();
      res.status(201).json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    // console.log(req.query);
    const { title, priceMin, priceMax, sort, page } = req.query;

    // {
    //   product_name: new RegExp(title, "i"),
    //   product_price: { $gte: priceMin, $lte: priceMax },
    // }

    const filter = {};
    // console.log(filter);

    if (title) {
      filter.product_name = new RegExp(title, "i");
    }
    // console.log(filter);
    if (priceMin) {
      console.log("J'ai reçu un price min ");
      filter.product_price = { $gte: Number(priceMin) };
    }
    // console.log(filter);

    if (priceMax) {
      // console.log("J'ai reçu un priceMax");
      if (filter.product_price) {
        // console.log(
        //   "la clef product_price existe déjà, donc je l'ai déjà crée donc j'ai aussi reçu un price min"
        // );
        filter.product_price.$lte = Number(priceMax);
      } else {
        // console.log(
        //   "la clef product_price n'existe pas donc je ne l'ai pas déjà créée donc je n'ai pas reçu de price min"
        // );
        filter.product_price = { $lte: Number(priceMax) };
      }
    }

    const sortFilter = {};

    if (sort === "price-desc") {
      sortFilter.product_price = -1;
    } else if (sort === "price-asc") {
      sortFilter.product_price = 1;
    }

    const limit = 3;

    // 5 résultats par page : 1 skip=0  2 skip=5 3 skip=10
    // 3 résultats par page : 1 skip=0  2 skip=3 3 skip=6 4 : skip=9

    // skip  = nombre de résultats par page * (num de page -1)

    let pageRequired = 1;
    if (page) {
      pageRequired = page;
    }

    const skip = (pageRequired - 1) * limit;
    console.log(skip);

    console.log(filter);
    const offers = await Offer.find(filter)
      .sort(sortFilter)
      .skip(skip)
      .limit(limit)
      .populate("owner", "account");

    const count = await Offer.countDocuments(filter);

    res.json({ count: count, offers: offers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    console.log(req.params);
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
