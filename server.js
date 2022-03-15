const fs = require('fs');
const path = require('path');
const express = require("express");
const axios = require("axios");
const faker = require("faker");
const cors = require("cors")
const { v4: uuidv4 } = require("uuid");
const {regions, provinces, cities, barangays} = require('select-philippines-address');
require("dotenv").config()
const {seed} = require("./seed")

const app = express();

app.use(cors())

app.get("/", async (req, res) => {
	res.json(seed)
})

// mock data comming from pexels api saved in json file
app.get("/mocks", async (req, res) => {
	try {
		const { q, limit, page } = req.query
		let results;
		if(q) results = seed[q]
		else results = seed

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
	} catch (err) {
		res.status(500).send('Something went wrong')
	}
});

// get city/province, municipalities in Philippines
const getPlacesInPh = async () => {
	try {
		const regionsData = await regions()

		const promises = regionsData.map(async region => {
			let provincesData = await provinces(region.region_code)
			return provincesData.map(x => ({code: x.province_code, name: x.province_name}))
		})

		const codeandnameonly = await Promise.all(promises)
		const promises2 = codeandnameonly.flat().map(async x => {
			let citiesData = await cities(x.code)
			return citiesData.map(y => `${x.name}, ${y.city_name}`)
		})
		const results = await Promise.all(promises2)

		return results.flat()
	} catch(err) {
		console.log(err)
	}
}

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
	console.log('Server running')
});
