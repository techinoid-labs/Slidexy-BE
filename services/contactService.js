const Contact = require("../models/Contact");

class ContactService {
  async createContact(data) {
    const { name, email, message, userId = null } = data;

    const contact = new Contact({
      name,
      email,
      message,
      user: userId || null,
    });

    return await contact.save();
  }

  async getAllContacts() {
    return await Contact.find().sort({ createdAt: -1 });
  }
}

module.exports = new ContactService();
