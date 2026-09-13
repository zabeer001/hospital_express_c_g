const bookingInclude = {
  patient: {
    select: { id: true, name: true, age: true, gender: true, phone: true },
  },
  doctor: {
    select: { id: true, name: true, specialization: true, hospital: true },
  },
};

export { bookingInclude };
