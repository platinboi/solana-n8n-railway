import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import webhookRouter from './webhooks/n8n';
import {
    createSolanaRpc,
    createSolanaRpcSubscriptions,
} from '@solana/web3.js';

const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: 'Too many requests, please try again later.'
    }
});

app.use(cors());
app.use(express.json());
app.use(limiter);

export const rpc = createSolanaRpc(config.solanaRpcUrl);
export const rpcSubscriptions = createSolanaRpcSubscriptions(config.solanaWsUrl);

app.get('/health', (_: Request, res: Response) => {
    res.status(200).send('OK');
});

app.use('/api', webhookRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
    });
});

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});
