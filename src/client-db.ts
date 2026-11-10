import Dexie,{type Table} from 'dexie';
import type {SkillOfferRecord} from './domain/skill-offer';
export type OutboxItem={id:string;payload:unknown;createdAt:number;attempts:number;lastError?:string};
export class LocalDatabase extends Dexie {
  outbox!:Table<OutboxItem,string>;
  exchangeDrafts!:Table<SkillOfferRecord,string>;
  constructor(){
    super("idea-skill-time-bank");
    this.version(1).stores({outbox:'id,createdAt,attempts'});
    this.version(2).stores({outbox:'id,createdAt,attempts',exchangeDrafts:'id,status,updatedAt'});
  }
}
export const localDatabase=new LocalDatabase();
