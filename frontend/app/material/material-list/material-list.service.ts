import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class MaterialListService {
    public materials$: BehaviorSubject<Array<any>> = new BehaviorSubject([]);
    
    constructor() {}

}