import { Router } from "express";

import { Deck } from "../../Game/Models/Deck";

// import { auth } from "../../middleware/auth";

// import ee from "../../../controllers/EventEmmiter"

const router = Router();

// @route GET api/deck
// @access public
router.get('/', (req, res) => {
    Deck.find()
        // .sort({ date: -1 })
        .then((Decks) => {
            res.json(Decks);
        })
})

// @route GET api/deck
// @access public
router.get('/:id', (req, res) => {
    Deck.find({_id: req.params.id})
        // .sort({ date: -1 })
        .then((Deck) => {
            res.json(Deck);
        })
})

// @route POST api/Deck
// @access public
router.post('/', (req, res) => {

    // console.log(req.body)

    new Deck({
        title: req.body.title,
        // url: req.body.url,
        logo: req.body.logo,
        restrictions: req.body.restrictions,
        leadCards: req.body.leadCards,
        secondCards: req.body.secondCards
    }).save()
        .then((Deck) => {
            // ee.emit("Deck.created", Deck)
            res.json(Deck);
        })

})

router.put("/:id", (req,res) => {
    Deck
        .find({_id: req.params.id})
        .then((deck) => {
            const mutated = {
                ...deck,
                ...JSON.parse(req.body.deck)
            }

            
        })
})

// @route GET api/Deck/:id/game
// @access public
// router.get('/:id/game', auth, (req, res) => {

//     res.json(GameFabric.getList());

// })


// @route POST api/Deck/:id/game/:name
// @access public
// router.post('/:id/game/:name', auth, (req, res) => {
//     Deck.findOne({ name: req.params.id })
//         .then((Deck) => {
//             const gameItem = GameFabric.create(req.params.name);
//             // Deck.game = gameItem;
//             // TODO Game creation

//             Deck.save()
//                 .then(() => {
//                     res.json({ Deck, gameItem });
//                 })
//         })
//         .catch((err) => {
//             res.status(404).json({ success: false, err })
//         });

// })

// @route DELETE api/Deck/:id
// @access public
router.delete('/:id', (req, res) => {
    Deck.findById(req.params.id)
        .then((Deck) => {
            Deck.remove()
                .then(() => {
                    res.json({ success: true });
                })
        })
        .catch((err) => {
            res.status(404).json({ success: false })
        });
})


export default router;