
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(express.json());

app.use(cors({
    origin: process.env.FRONTEND_URL
}));

// Comprobar que el servidor funciona
app.get("/", function(req, res) {
    res.send("EDU AI está funcionando correctamente.");
});

// Recibir preguntas y responder con IA
app.post("/api/chat", async function(req, res) {

    try {

        const pregunta = req.body.question;
        const materia = req.body.materia || "General";
        const modo = req.body.mode || "explicar";
        const historial = req.body.history || [];

        if (!pregunta || !pregunta.trim()) {
            return res.status(400).json({
                error: "Tenés que escribir una pregunta."
            });
        }

        if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
            return res.status(500).json({
                error: "Falta configurar la inteligencia artificial."
            });
        }

        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        let instrucciones =
            "Sos EDU AI, un asistente educativo. " +
            "Tu objetivo es ayudar a estudiantes con sus materias. " +
            "Explicá de forma sencilla, clara y ordenada. " +
            "La materia seleccionada es: " + materia + ".";

        if (modo === "summary") {
            instrucciones +=
                " Tu tarea es resumir el texto de manera clara y breve.";
        }

        if (modo === "translate") {
            instrucciones +=
                " Tu tarea es traducir el texto al idioma que solicite el usuario.";
        }

        let conversacion = "";

        if (Array.isArray(historial)) {
            historial.slice(-10).forEach(function(mensaje) {

                if (
                    mensaje &&
                    (mensaje.role === "user" ||
                    mensaje.role === "assistant") &&
                    typeof mensaje.content === "string"
                ) {
                    conversacion +=
                        mensaje.role + ": " +
                        mensaje.content.substring(0, 2000) + "\n";
                }

            });
        }

        const respuesta = await client.responses.create({

            model: process.env.OPENAI_MODEL,

            instructions: instrucciones,

            input: conversacion +
                "\nPregunta actual: " + pregunta,

            max_output_tokens: 900

        });

        res.json({
            reply: respuesta.output_text
        });

    } catch (error) {

        console.error("Error de EDU AI:", error.message);

        res.status(500).json({
            error: "No se pudo generar la respuesta. Revisá la configuración del servidor."
        });

    }

});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", function() {
    console.log("Servidor de EDU AI iniciado.");
});
