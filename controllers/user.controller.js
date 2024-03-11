const db = require("../db");
const errors = require("../errors");
const { hash, compare } = require("bcrypt");
const jwt = require("jsonwebtoken");

const hashPassword = async (password) => {
  const saltRounds = 10;
  return hash(password, saltRounds);
};

class UserController {
  async registerUser(req, res) {
    const { name, surname, email, password } = req.body;
    try {
      const existUser = await db.query(
        "SELECT * FROM person WHERE email = $1",
        [email]
      );
      if (existUser.rows.length > 0) {
        return res.status(400).json({ error: errors.USER_EXIST });
      }
      const hashedPassword = await hashPassword(password);

      const newPerson = await db.query(
        "INSERT INTO person (name, surname, email, password) values ($1, $2, $3, $4) RETURNING id, name, surname",
        [name, surname, email, hashedPassword]
      );
      const token = jwt.sign({ email }, process.env.SECRET_JWT, {
        expiresIn: process.env.EXPIRE_JWT,
      });

      const publicUser = {
        id: newPerson.rows[0].id,
        name: newPerson.rows[0].name,
        surname: newPerson.rows[0].surname,
        token,
      };

      res.json({ ...publicUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async loginUser(req, res) {
    const { email, password } = req.body;
    try {
      const user = await db.query("SELECT * FROM person WHERE email = $1", [
        email,
      ]);

      if (user.rows.length === 0) {
        return res.status(401).json({ error: errors.USER_NOT_FOUND });
      }

      const passwordMatch = await compare(password, user.rows[0].password);

      if (!passwordMatch) {
        return res.status(401).json({ error: errors.INVALID_PASSWORD });
      }

      const token = jwt.sign({ email }, process.env.SECRET_JWT, {
        expiresIn: process.env.EXPIRE_JWT,
      });

      const publicUser = {
        id: user.rows[0].id,
        name: user.rows[0].name,
        surname: user.rows[0].surname,
        token,
      };

      res.json({ ...publicUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getUsers(req, res) {
    try {
      const users = await db.query("SELECT id, name, surname FROM person");
      res.json(users.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getOneUser(req, res) {
    const userId = req.params.id;
    try {
      const user = await db.query(
        "SELECT id, name, surname FROM person WHERE id = $1",
        [userId]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({ error: errors.USER_NOT_FOUND });
      }

      res.json(user.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async updateUser(req, res) {
    const userId = req.params.id;
    const { name, surname } = req.body;
    try {
      const updatedUser = await db.query(
        "UPDATE person SET name = $1, surname = $2 WHERE id = $3 RETURNING id, name, surname",
        [name, surname, userId]
      );

      if (updatedUser.rows.length === 0) {
        return res.status(404).json({ error: errors.USER_NOT_FOUND });
      }

      res.json(updatedUser.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async deleteUser(req, res) {
    const userId = req.params.id;
    try {
      const deletedUser = await db.query(
        "DELETE FROM person WHERE id = $1 RETURNING id, name, surname",
        [userId]
      );

      if (deletedUser.rows.length === 0) {
        return res.status(404).json({ error: errors.USER_NOT_FOUND });
      }

      res.json(deletedUser.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

module.exports = new UserController();
