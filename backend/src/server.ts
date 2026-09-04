import cors from '@fastify/cors'
import Fastify from "fastify";
import { planRoutes } from "./routes/plan";
import { clientesRoutes } from "./routes/clientes";

const app = Fastify({
    logger: true,
});

await app.register(cors, {
    origin: "*",
    // PATCH (editar dieta) e DELETE (apagar dieta) tinham ficado de fora
    // aqui — o browser bloqueava esses pedidos no preflight CORS antes
    // sequer de chegarem ao backend (parecia "backend não está a correr").
    methods: ["GET", "POST", "PATCH", "DELETE"],
});

app.get("/teste", (req, res) => {
    res.send("Hello World");
});

app.register(planRoutes);
app.register(clientesRoutes);

app.listen({ port: Number(process.env.PORT) || 3333, host: "0.0.0.0" })
    .then(() => { 
        console.log("Server is running on port 3333");
    })
    .catch((err) => {
        app.log.error(err);
        process.exit(1);
    });



