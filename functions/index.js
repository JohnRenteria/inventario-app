const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Esta es nuestra función "callable" que cambia la contraseña de un usuario.
exports.updateUserPassword = functions.https.onCall(async (data, context) => {
  // 1. Verifica si el usuario que llama a la función está autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "La función solo puede ser llamada por un usuario autenticado.",
    );
  }

  // 2. Verifica si el usuario que llama tiene el rol permitido
  const callerUid = context.auth.uid;
  const userRecord = await admin.firestore()
      .collection("users").doc(callerUid).get();
  const userRole = userRecord.data().rol;

  if (!["Jefe de Barra", "Administradora"].includes(userRole)) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "No tienes permiso para realizar esta acción.",
    );
  }

  // 3. Obtiene el ID del usuario a modificar y la nueva contraseña
  const {userId, newPassword} = data;

  if (!userId || !newPassword || newPassword.length < 6) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "El ID de usuario y una contraseña de al menos 6 caracteres " +
        "son requeridos.",
    );
  }

  // 4. Usa el Admin SDK para actualizar la contraseña del usuario
  try {
    await admin.auth().updateUser(userId, {
      password: newPassword,
    });
    return {
      result: `Contraseña para el usuario ${userId} actualizada correctamente.`,
    };
  } catch (error) {
    console.error("Error al actualizar la contraseña:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Ocurrió un error al actualizar la contraseña del usuario.",
    );
  }
});
