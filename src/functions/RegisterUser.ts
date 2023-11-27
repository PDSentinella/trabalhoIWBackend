import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import postgreesql from "./postgreesql";
import * as bcrypt from 'bcrypt';

export async function RegisterUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const saltRounds = 10;

    const hashPassword = async (plainTextPassword: string): Promise<string> => {
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(plainTextPassword, salt);
        return hash;
    };

    try {
        //Json só pode ser recebido em metodos posts mas mesmo assim temos de verificar o tipo de envio!
        const contentType = request.headers.get('Content-Type');

        if (contentType && contentType.toLowerCase() === 'application/json') {
            const requestBody = await request.json() as user;
            // Validar Json recebido para devido uso!
            if (!requestBody.name || !requestBody.email || !requestBody.password || !requestBody.genero) {
                return {
                    status: 400,
                    body: "Bad Request. Email and password are required in the JSON body."
                };
            }
            const postgresConnection = new postgreesql();
            //Tentar fazer registo do user
            try {
                await postgresConnection.connect();
                const hashedPass = await hashPassword(requestBody.password);
                const user = {
                    name: requestBody.name,
                    email: requestBody.email,
                    password: hashedPass,
                    genero: requestBody.genero,
                    profile_image: !requestBody.profile_image ? null : requestBody.profile_image,
                    admin_privileges: false
                }
                // Use parameterized query to prevent SQL injection
                const query = `INSERT INTO users(name, email, password, genero, profile_image, admin_privileges) VALUES ($1, $2, $3, $4, $5, $6)`;

                const result = await postgresConnection.query(query, [
                    user.name,
                    user.email,
                    user.password,
                    user.genero,
                    user.profile_image,
                    user.admin_privileges
                ]);
                const response: HttpResponseInit = {
                    status: 201, // created
                    body: JSON.stringify(user)
                }
                return response;
            } catch (error) {
                const errorResponse: HttpResponseInit = {
                    status: 500,
                    body: "Internal Server Error",
                };
                return errorResponse;
            } finally {
                postgresConnection.disconnect();
            }
        }

    } catch (error) {
        const errorResponse: HttpResponseInit = {
            status: 500,
            body: "Internal Server Error",
        };
        return errorResponse;
    }

};

app.http('RegisterUser', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: RegisterUser
});


interface user {
    name: string,
    email: string,
    password: string,
    profile_image: string,
    genero: string,
    admin_privileges: boolean
}