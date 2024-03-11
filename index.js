const express = require("express");
const { scrapeLogic } = require("./scrapeLogic.js") 

const app = express();

const PORT = process.env.port || 4000;

app.listen(PORT, () => {
    console.log(`listeniing on ${PORT}`);
})

app.get("/scrape", async(req,res) => {
    scrapeLogic(res);
})

app.get("/", (req,res) => {
    res.send("server up and running..")
})