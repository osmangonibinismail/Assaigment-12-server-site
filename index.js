const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5001;

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Assaigment 12 is running')
});

app.listen(port, () =>{
    console.log(`Assaigment 12 is running on port ${port}`);
})
