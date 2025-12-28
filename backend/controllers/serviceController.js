import Service from "../models/Service.js";

export const createService = async (req, res) => {
  try {
    const { name, price, serviceLocation, availableCities } = req.body;

    if (!name || !price || !serviceLocation) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const service = await Service.create({
      name,
      price,
      serviceLocation: serviceLocation.toLowerCase(),
      availableCities: availableCities || [],
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: "Failed to create service" });
  }
};

export const getServices = async (req, res) => {
  try {
    let { location } = req.query;

    if (!location) {
      const services = await Service.find();
      return res.json(services);
    }

    location = location.toLowerCase();

    const services = await Service.find({
      $or: [
        { serviceLocation: location },
        { availableCities: location },
      ],
    });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch services" });
  }
};
