"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = __importDefault(require("fs/promises"));
const OPTIMIZE_API_URL = (0, core_1.getInput)('optimize_api_url');
const COLLECTION_ID = (0, core_1.getInput)('collection_id');
const CONNECTION_TYPE = (0, core_1.getInput)('connection_type');
const SOURCE = (0, core_1.getInput)('source');
const CLIENT_ID = (0, core_1.getInput)('client_id');
const CLIENT_SECRET = (0, core_1.getInput)('client_secret');
const AUDIENCE = (0, core_1.getInput)('audience');
const AUTH_SERVER_URL = (0, core_1.getInput)('auth_server_url');
// TODO: Check code but should be ready to test as action.
const getTokenCloud = async () => {
    try {
        const data = {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            audience: AUDIENCE,
            grant_type: 'client_credentials'
        };
        const response = await axios_1.default.post(AUTH_SERVER_URL, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.status === 200) {
            const token = response.data.access_token;
            // Remove all whitespaces from token
            return token.replace(/\s+/g, '');
        }
        else {
            console.error('Error:', response.statusText);
            return null;
        }
    }
    catch (error) {
        (0, core_1.setFailed)(error instanceof Error ? error.message : 'An error occurred');
        return null;
    }
};
const getTokenSelfManaged = async () => {
    try {
        const data = {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            audience: AUDIENCE,
            grant_type: 'client_credentials'
        };
        const response = await axios_1.default.post(AUTH_SERVER_URL, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        if (response.status === 200) {
            const token = response.data.access_token;
            // Remove all whitespaces from token
            return token.replace(/\s+/g, '');
        }
        else {
            console.error('Error:', response.statusText);
            return null;
        }
    }
    catch (error) {
        (0, core_1.setFailed)(error instanceof Error ? error.message : 'An error occurred');
        return null;
    }
};
const getTokenByConnectionType = async () => {
    try {
        if (CONNECTION_TYPE === 'cloud') {
            return await getTokenCloud();
        }
        else if (CONNECTION_TYPE === 'self-managed') {
            return await getTokenSelfManaged();
        }
        else {
            console.error('Invalid connection_type specified.');
            return false;
        }
    }
    catch (error) {
        (0, core_1.setFailed)(error instanceof Error ? error.message : 'An error occurred');
    }
};
const isValidPath = async (sourceFolderPath) => {
    // Check if the destination path is empty or only contains whitespaces
    if (!sourceFolderPath || sourceFolderPath.trim().length === 0) {
        console.error('Destination path is empty.');
        return false;
    }
    const isInvalidPath = (path) => {
        // Regex to find invalid characters. In Ubuntu, aside from `/` at the start or middle,
        // other characters like `*`, `?`, `"`, `<`, `>`, `|`, and null byte are not allowed in names.
        // This regex does not catch every possible invalid character but covers many common cases.
        const invalidCharsOrPattern = /[*?"<>|]|\/|\0/;
        return invalidCharsOrPattern.test(path);
    };
    // Check if the path is absolute or contains invalid characters
    if (node_path_1.default.isAbsolute(sourceFolderPath) || isInvalidPath(sourceFolderPath)) {
        console.error('Source path is invalid or contains invalid characters.');
        return false;
    }
    else {
        return true;
    }
};
const readOptimizeArtifactsFromFile = async (sourceFolderPath) => {
    try {
        const validatedSourcePath = await isValidPath(sourceFolderPath);
        if (!validatedSourcePath) {
            console.log('Invalid destination path.');
            process.exit(1);
        }
        const fileName = 'optimize-entities.json';
        const sourceFilePath = node_path_1.default.join(sourceFolderPath, `${fileName}`);
        if (!fs.existsSync(sourceFilePath)) {
            console.log(`Can't find file at: ${sourceFilePath}`);
            return;
        }
        const fileContent = await promises_1.default.readFile(sourceFilePath, 'utf8');
        if (!fileContent) {
            console.log(`File at ${sourceFilePath} is empty.`);
            return;
        }
        return JSON.parse(fileContent);
    }
    catch (error) {
        (0, core_1.setFailed)(error instanceof Error ? error.message : 'An error occurred');
    }
};
const importOptimizeDefinitions = async (optimizeEntityDefinitionsData) => {
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
        const response = await axios_1.default.post(url, optimizeEntityDefinitionsData, { headers });
        console.log('Response:', JSON.stringify(response.data, null, 2));
    }
    catch (error) {
        (0, core_1.setFailed)(error instanceof Error ? error.message : 'An error occurred');
    }
};
const runWorkflow = async () => {
    try {
        const optimizeDefinitions = await readOptimizeArtifactsFromFile(SOURCE);
        await importOptimizeDefinitions(optimizeDefinitions);
    }
    catch (error) {
        (0, core_1.setFailed)(error instanceof Error ? error.message : 'An error occurred');
    }
};
runWorkflow()
    .then(() => {
    console.log("Workflow completed successfully.");
})
    .catch((error) => {
    (0, core_1.setFailed)(error instanceof Error ? error.message : 'An error occurred');
});
