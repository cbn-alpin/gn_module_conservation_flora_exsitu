import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class StockManagementService {
    private totalInitialQuantitySubject = new BehaviorSubject<number>(0);
    private totalCurrentQuantitySubject = new BehaviorSubject<number>(0);

    totalInitialQuantity$ = this.totalInitialQuantitySubject.asObservable();
    totalCurrentQuantity$ = this.totalCurrentQuantitySubject.asObservable();

    updateInitialQuantity(value: number) {
        this.totalInitialQuantitySubject.next(value);
    }

    updateCurrentQuantity(value: number) {
        this.totalCurrentQuantitySubject.next(value);
    }
}