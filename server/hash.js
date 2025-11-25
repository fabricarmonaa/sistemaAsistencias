const bcrypt = require('bcrypt');

const contrasena = '47055885'; // la contraseña que querés hashear

bcrypt.hash(contrasena, 10).then(hash => {
  console.log("Hash generado:");
  console.log(hash);
});
