const { Router } = require("express");
const { mandarMail } = require("../utils/mailing.js");
const { loginCheck} = require("./controllers/userlogin.controllers.js");
const {deleteUser} = require("./controllers/user.controllers.js");
const { User } = require('../db/db.js')
const path = require('node:path');
const fs = require('fs');
const handlebars = require("handlebars");
const filePath = path.join(__dirname, '../utils/templates/welcome.html');
const source = fs.readFileSync(filePath, 'utf-8').toString();
const template = handlebars.compile(source);
const { MAIL_PORT} = process.env;


const router = Router();
const {
  createUser,
  getAllUsers,
  updateUser,
  getUserInfo
} = require("./controllers/user.controllers.js");

router.post("/", async (req, res, next) => {
  // recibe por body las propiedades de user
  const { name, mail, password, admin } = req.body;
  const url=`${MAIL_PORT}/home`
  const template = handlebars.compile(source);
  const replacements = {
      username: name,
      url:url
  };
  const htmlToSend = template(replacements);
  if (!name || !mail || !password) {
    return res.status(400).send("Faltan datos obligatorios.");
  }

  // si estan, creo un user
  try {
    await createUser(name, mail, password, admin);

    mandarMail(
      mail,
      "Gracias por registrarte a Henry Fittnes",
      `Hola ${name}, felicitaciones, tomaste el primer paso a una vida más sana!`,
      htmlToSend 
    );

    try {
      const result = await loginCheck(mail, password);
      res.status(200).send(result);
    } catch (error) {
      res.status(400).send("Error de login");
    }

  } catch (e) {
    res.status(400).send("Error al crear usuario");
  }
});

router.put("/", async (req, res) => {
  try {
    const { id, password, dni, address, birthday, image, name } = req.body;
    const update = await updateUser(id, password, dni, address, birthday, image, name);
    return res.status(200).json(update);
  } catch (error) {
    console.log(error)
    res.status(400).json(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.status(200).send(users);
  } catch (error) {
    res.status(400).send("Error. No se encontraron usuarios.");
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    let { id } = req.params
    const userInfo = await getUserInfo(id);
    res.status(200).json(userInfo);
  } catch (error) {
    res.status(400).send("Error. No se encontro el usuario");
  }
});


router.delete("/:id", async(req, res) =>{
  try{
    const {id} = req.params;
    const {paranoid} = req.body
    const response = await deleteUser(id, paranoid);
    res.status(200).json(response);


  }catch(error){
    res.status(400).json({message:error.message})
  }
})

module.exports = router;
