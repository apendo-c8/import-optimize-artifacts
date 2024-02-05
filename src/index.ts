import {getInput, setFailed} from "@actions/core";
import axios, {AxiosResponse} from 'axios';
import * as fs from 'fs';
import path from "node:path";
import fsPromises from 'fs/promises';


const OPTIMIZE_API_URL = getInput('optimize_api_url');
const COLLECTION_ID = getInput('collection_id');
const CONNECTION_TYPE = getInput('connection_type');
const SOURCE = getInput('source');
const CLIENT_ID = getInput('client_id');
const CLIENT_SECRET = getInput('client_secret');
const AUDIENCE = getInput('audience');
const AUTH_SERVER_URL = getInput('auth_server_url');

// TODO: Check code but should be ready to test as action.
const getTokenCloud = async () => {
    try {

        const data = {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            audience: AUDIENCE,
            grant_type: 'client_credentials'
        };

        const response = await axios.post(AUTH_SERVER_URL, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {

            const token = response.data.access_token;

            // Remove all whitespaces from token
            return token.replace(/\s+/g, '');

        } else {
            console.error('Error:', response.statusText);

            return null;
        }
    } catch (error) {

        setFailed(error instanceof Error ? error.message : 'An error occurred');

        return null;
    }
}

const getTokenSelfManaged = async () => {

    try {

        const data = {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            audience: AUDIENCE,
            grant_type: 'client_credentials'
        };

        const response = await axios.post(AUTH_SERVER_URL, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.status === 200) {
            const token = response.data.access_token;

            // Remove all whitespaces from token
            return token.replace(/\s+/g, '');

        } else {

            console.error('Error:', response.statusText);

            return null;
        }
    } catch (error) {

        setFailed(error instanceof Error ? error.message : 'An error occurred');

        return null;
    }
}

const getTokenByConnectionType = async () => {

    try {
        if (CONNECTION_TYPE === 'cloud') {

            return await getTokenCloud();

        } else if (CONNECTION_TYPE === 'self-managed') {

            return await getTokenSelfManaged();

        } else {

            console.error('Invalid connection_type specified.');

            return false;
        }

    } catch (error) {

        setFailed(error instanceof Error ? error.message : 'An error occurred');
    }

}

const isValidPath = async (sourceFolderPath: string): Promise<boolean> => {

    // Check if the destination path is empty or only contains whitespaces
    if (!sourceFolderPath || sourceFolderPath.trim().length === 0) {

        console.error('Destination path is empty.');
        return false;
    }

    const isInvalidPath = (path: string): boolean => {
        // Regex to find invalid characters. In Ubuntu, aside from `/` at the start or middle,
        // other characters like `*`, `?`, `"`, `<`, `>`, `|`, and null byte are not allowed in names.
        // This regex does not catch every possible invalid character but covers many common cases.
        const invalidCharsOrPattern = /[*?"<>|]|\/|\0/;
        return invalidCharsOrPattern.test(path);

    };

    // Check if the path is absolute or contains invalid characters
    if (path.isAbsolute(sourceFolderPath) || isInvalidPath(sourceFolderPath)) {
        console.error('Source path is invalid or contains invalid characters.');
        return false;

    } else {

        return true;
    }
};

const readOptimizeArtifactsFromFile = async (sourceFolderPath: string) => {
    try {

        const validatedSourcePath = await isValidPath(sourceFolderPath);

        if (!validatedSourcePath) {

            console.log('Invalid destination path.');
            process.exit(1);

        }

        const fileName = 'optimize-entities.json';
        const sourceFilePath = path.join(sourceFolderPath, `${fileName}`);

        if (!fs.existsSync(sourceFilePath)) {
            console.log(`Can't find file at: ${sourceFilePath}`);
            return;
        }

        const fileContent = await fsPromises.readFile(sourceFilePath, 'utf8');
        if (!fileContent) {
            console.log(`File at ${sourceFilePath} is empty.`);
            return;
        }

        return JSON.parse(fileContent);

    } catch (error) {

        setFailed(error instanceof Error ? error.message : 'An error occurred');
    }
};

const importOptimizeDefinitions = async (optimizeEntityDefinitionsData: any) => {

    const url = `${OPTIMIZE_API_URL}/api/public/import?collectionId=${COLLECTION_ID}`;
    const token = await getTokenByConnectionType();

    if (!token) {

        console.error('Failed to retrieve token.');
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    try {

        const response: AxiosResponse = await axios.post(url, optimizeEntityDefinitionsData, {headers});
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {

        setFailed(error instanceof Error ? error.message : 'An error occurred');

    }

}

const runWorkflow = async () => {
    try {

        const optimizeDefinitions = await readOptimizeArtifactsFromFile(SOURCE);

        await importOptimizeDefinitions(optimizeDefinitions);


    } catch (error) {

        setFailed(error instanceof Error ? error.message : 'An error occurred');
    }

}

runWorkflow()
    .then(() => {
        console.log("Workflow completed successfully.");
    })
    .catch((error) => {

        setFailed(error instanceof Error ? error.message : 'An error occurred');

    });