const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5001;

// middleware
app.use(cors());
app.use(express.json());

// mongodb connect

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cgjyhyw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // collection name in mogodb
        const userCollection = client.db("scholarshipManagement").collection("users");
        const scholarshipCollection = client.db("scholarshipManagement").collection("allScholarship");
        const scholarshipCartCollection = client.db("scholarshipManagement").collection("scholarshipCart");

        // user related api
        app.post('/users', async (req, res) => {
            const user = req.body;
            // insert email if user doesn't exists:
            // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
              return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
          });

        // all scholarship page
        app.get('/allScholarship', async (req, res) => {
            const result = await scholarshipCollection.find().toArray();
            res.send(result);
        })

        // scholarship cart page
        app.get('/scholarshipCart', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await scholarshipCartCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/scholarshipCart', async (req, res) => {
            const cartItem = req.body;
            const result = await scholarshipCartCollection.insertOne(cartItem);
            res.send(result);
        })

        // scholarship cart delete
        app.delete('/scholarshipCart/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await scholarshipCartCollection.deleteOne(query);
            res.send(result);
          })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Assaigment 12 is running')
});

app.listen(port, () => {
    console.log(`Assaigment 12 is running on port ${port}`);
});
