const express = require('express');
const app = express();
require('dotenv').config()
const jwt = require('jsonwebtoken');
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


        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '5h'
            });
            res.send({ token });
        })
        // middlewares
        const verifyToken = (req, res, next) => {
            // console.log('inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }

            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' });
                }
                req.decoded = decoded;
                next();
            })
        }

        // use verify admin after verifyToken
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        }

        // user related api
        app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })

        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin });
        })

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

        app.patch('/users/admin/:id', verifyAdmin, verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query);
            res.send(result);
        })

        // all scholarship page
        app.get('/allScholarship', async (req, res) => {
            const result = await scholarshipCollection.find().toArray();
            res.send(result);
        })

        // update page
        app.get('/allScholarship/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await scholarshipCollection.findOne(query);
            res.send(result);
        })
        // update item
        app.patch('/allScholarship/:id', async (req, res) => {
            const item = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    scholarshipName: item.scholarshipName,
                    universityName: item.universityName,
                    universityCountry: item.universityCountry,
                    universityCity: item.universityCity,
                    subjectName: item.subjectName,
                    subjectCategory: item.subjectCategory,
                    scholarshipCategory: item.scholarshipCategory,
                    degree: item.degree,
                    universityWorldRank: item.universityWorldRank,
                    rating: item.rating,
                    stipend: item.stipend,
                    applicationFees: item.applicationFees,
                    serviceCharge: item.serviceCharge,
                    tuitionFees: item.tuitionFees,
                    applicationDeadline: item.applicationDeadline,
                    scholarshipPostDate: item.scholarshipPostDate,
                    scholarshipDetails: item.scholarshipDetails,
                    image: item.image
                }
            }
            const result = await scholarshipCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        // add scholarship item
        app.post('/allScholarship', verifyToken, verifyAdmin, async (req, res) => {
            const item = req.body;
            const result = await scholarshipCollection.insertOne(item);
            res.send(result);
        })

        // delete scholarship item
        app.delete('/allScholarship/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await scholarshipCollection.deleteOne(query);
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
