import { auth } from "@/lib/better-auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

const getHandlers = async () => toNextJsHandler(await auth());

export const GET = async (request: Request) => {
    const { GET } = await getHandlers();
    return GET(request);
};

export const POST = async (request: Request) => {
    const { POST } = await getHandlers();
    return POST(request);
};

export const PATCH = async (request: Request) => {
    const { PATCH } = await getHandlers();
    return PATCH(request);
};

export const PUT = async (request: Request) => {
    const { PUT } = await getHandlers();
    return PUT(request);
};

export const DELETE = async (request: Request) => {
    const { DELETE } = await getHandlers();
    return DELETE(request);
};
