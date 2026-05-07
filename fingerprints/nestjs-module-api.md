---
name: nestjs-module-api
description: NestJS v11 module patterns for keeper services — event-driven architecture
version: "@nestjs/common ^11 | @nestjs/event-emitter ^3"
validated: 2026-05-08
---

## Service structure
@Injectable()
export class KeeperService implements OnModuleInit {
  constructor(@Inject("CONFIG") private readonly config: Config) {}
  async onModuleInit() { /* setup viem clients, start block loop */ }
  @OnEvent("position.materialized") handleEvent(e: MyEvent) { /* queue logic */ }
}

## Event emitter (EventsService emits, KeeperService handles)
constructor(private readonly emitter: EventEmitter2) {}
this.emitter.emit("position.materialized", { positionId, materializedBlock } satisfies MyEvent);

## Zod config validation (fail fast on startup)
export const ConfigSchema = z.object({
  RPC_URL: z.string().min(1),          // WebSocket: wss://
  HTTP_RPC_URL: z.string().url(),      // HTTP: https://
  KEEPER_PRIVATE_KEY: z.string().startsWith("0x").length(66),
  FINALITY_BLOCKS: z.coerce.number().default(96),
});
export type Config = z.infer<typeof ConfigSchema>;

## Module registration
@Module({ providers: [{ provide: "CONFIG", useValue: config }, KeeperService] })
