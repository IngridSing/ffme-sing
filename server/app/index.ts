import 'module-alias/register'; // DOIT être tout en haut
import 'reflect-metadata';

import { Server } from '@app/server';
import { Container } from 'typedi';

const server: Server = Container.get(Server);
server.init();
