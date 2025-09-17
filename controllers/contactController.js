const contactService = require("../services/contactService");

class ContactController {
  async create(req, res) {
    try {
      const { name, email, message } = req.body;
      const userId = req.user ? req.user.id : null; // if auth is used

      if (!name || !email || !message) {
        return res.status(400).json({ error: "All fields are required." });
      }

      const contact = await contactService.createContact({
        name,
        email,
        message,
        userId,
      });
      res
        .status(201)
        .json({ message: "Contact form submitted successfully", contact });
    } catch (err) {
      console.error("Error creating contact:", err);
      res.status(500).json({ error: "Server error" });
    }
  }

  async getAll(req, res) {
    try {
      const contacts = await contactService.getAllContacts();
      res.json(contacts);
    } catch (err) {
      console.error("Error fetching contacts:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
}

module.exports = new ContactController();
