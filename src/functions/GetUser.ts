import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import PostgresConnection from "./postgreesql";
import { Context } from "node:vm";

export async function GetUser(request: HttpRequest, context: Context): Promise<HttpResponseInit> {

    const email = request.query.get('email');
    
    if(email == null || email == undefined){
        const response: HttpResponseInit = {
            status: 400,
            body: "Invalid request body!",
        };
        return response;
    }else{
        
    }

    const postgresConnection = new PostgresConnection();


    try {
        await postgresConnection.connect();
        // Example query
        const query = `SELECT * FROM users WHERE email = '${email}'`;
        console.log(query)
        const result = await postgresConnection.query(query);
        context.log('Query Result:', result.rows);

        const response: HttpResponseInit = {
            status: 200,
            body: JSON.stringify(result.rows),
        };
        return response;
    } catch (error) {
        context.log.error('Error processing the request:', error);
        const errorResponse: HttpResponseInit = {
            status: 500,
            body: "Internal Server Error",
        };
        return errorResponse;
    } finally {
        await postgresConnection.disconnect();
    }
};

app.http('GetUser', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: GetUser
});


interface user {
    name: string,
    email: string,
    password: string,
    profile_image: string,
    genero: string,
    admin_privileges: boolean
}

interface userLogin{
    email: string,
    password: string,
}
