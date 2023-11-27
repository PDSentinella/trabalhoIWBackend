import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as bcrypt from 'bcrypt';
import PostgresConnection from "./postgreesql";

export async function LogIn(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

    //////////////////// funçoes para usar posteriormente //////////////////////////////////////
    const saltRounds = 10;

    const hashPassword = async (plainTextPassword: string): Promise<string> => {
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(plainTextPassword, salt);
        return hash;
    };

    const verifyPassword = async (plainTextPassword: string, hashedPassword: string): Promise<boolean> => {
        return bcrypt.compare(plainTextPassword, hashedPassword);
    };

    //////////////////////////////////////////////////////////////////////////////////////////

    try {
        //Json só pode ser recebido em metodos posts mas mesmo assim temos de verificar o tipo de envio!
        const contentType = request.headers.get('Content-Type');

        if (contentType && contentType.toLowerCase() === 'application/json') {
            const requestBody = await request.json() as userLogin;

            // Validar Json recebido para devido uso!
            if (!requestBody.email || !requestBody.password) {
                return {
                    status: 400,
                    body: "Bad Request. Email and password are required in the JSON body."
                };
            }

            //Verificar se email existe na base dados.
            const email = requestBody.email;
            const postgresConnection = new PostgresConnection();
            try {
                await postgresConnection.connect();
                let query = `Select * From users Where email = '${email}'`;
                const result = await postgresConnection.query(query);
                if (result.rows.length > 0) {
                    console.log('heyyyyyyy')
                    const user = result.rows[0]; // vai buscar apenas o primeiro resultado
                    const passToCompare = requestBody.password;

                    const isMatch = await bcrypt.compare(passToCompare, user.password);
                    // Como existe email, vamos proseguir com a confirmação da pass
                    if (isMatch) {
                        const response: HttpResponseInit = {
                            status: 200, //Sucesso
                            body: JSON.stringify({
                                email: user.email,
                                name: user.name,
                                profile_image: user.profile_image,
                                genero: user.genero,
                                admin_privileges: user.admin_privileges,
                            }),
                        };
                        return response;
                    } else {
                        const response: HttpResponseInit = {
                            status: 401, // Acesso negado
                            body: 'Dados errados, por favor verifique os seus dados.'

                        }
                        return response;
                    }

                } else {
                    const response: HttpResponseInit = {
                        status: 404, // Nao encontrado
                        body: 'Email não encontrado, por favor verifique os seus dados.'
                    }
                    return response;
                }

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
        return {
            status: 400, // endpoint invalido
            body: `Bad Request. Error parsing JSON body: ${error.message}`
        };
    }
}



app.http('LogIn', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: LogIn
});

interface userLogin {
    email: string;
    password: string;
}
