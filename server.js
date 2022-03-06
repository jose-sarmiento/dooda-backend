const express = require("express");
const axios = require("axios");
const faker = require("faker");
const cors = require("cors")
const { v4: uuidv4 } = require("uuid");
require("dotenv").config()

const app = express();

app.use(cors())

const data = {
	docs: [],
};

app.get("/mocks", async (req, res) => {
	const { q, limit, page } = req.query
	let results;
	if(q) results = data.docs.filter(x => x.type === q)
	else results = data.docs

    const pageNumber = Number(page) || 1
    const pageSize = Number(limit) || 20
    const startIndex = (pageNumber - 1) * pageSize
    const endIndex = pageNumber * pageSize
    const response = {}

    if(endIndex < results.length) {
    	response.next =  {
    		page: pageNumber + 1,
    		limit: pageSize
    	}
    }

    if(startIndex > 0) {
    	response.previous = {
    		page: pageNumber - 1,
    		limit: pageSize
    	}
    }
    
	response.docs = results.slice(startIndex, endIndex)
	res.send(response)
});

const seed = async () => {

	const hotels = await search("hotel%20rooms", "hotel");
	const houses = await search("house", "house");
	const farms = await search("farm", "farm");
	const pools = await search("pool", "pool");
	const beaches = await search("beach", "beach");
	const cabins = await search("cabin", "cabin");
	const domes = await search("dome", "dome");
	const offbeats = await search("offbeat", "offbeat");
	const islands = await search("island", "island");
	const treehouses = await search("treehouse", "treehouse");

	data.docs = [...hotels, ...houses, ...farms, ...pools, ...beaches, ...cabins, ...domes, 
	...offbeats, ...islands, ...treehouses];
};

const search = async (q, name) => {
	try {
		const { data } = await axios.get(`https://api.pexels.com/v1/search?query=${q}&per_page=40`, {
			headers: { Authorization: process.env.PEXELS_API_KEY },
		});

		let images = data.photos.map((x) => ({
			src: x.src,
			alt: x.alt,
		}));

		return generateFakeData(images, name);
	} catch(e) {
		console.log(e)
	}
};

const generateFakeData = (images, name) => {
	return images.map((x) => ({
		id: uuidv4(),
		name: x.alt,
		image: x.src,
		type: name,
		company: faker.company.companyName(),
		price: faker.datatype.number({
			min: 1000,
			max: 15000,
		}),
		address: {
			street: faker.address.streetName(),
			city: faker.address.city(),
			country: faker.address.country(),
			latitude: faker.address.latitude(),
			longitude: faker.address.longitude(),
		},
		stars: faker.datatype.number({
			min: 3,
			max: 5,
		}),
	}));
};

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
	console.log('Server running')
	seed()
});
