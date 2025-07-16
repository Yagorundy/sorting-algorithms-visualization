import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';

export interface HoverState {
  isHovered: boolean;
  event?: MouseEvent;
  componentId: string;
}

@Injectable({
  providedIn: 'root'
})
export class HoverStateManager implements OnDestroy {
  private hoverSubjects = new Map<string, Subject<HoverState>>();
  private subscriptions: Subscription[] = [];

  private getOrCreateSubject(componentId: string): Subject<HoverState> {
    if (!this.hoverSubjects.has(componentId)) {
      this.hoverSubjects.set(componentId, new Subject());
    }
    return this.hoverSubjects.get(componentId)!;
  }

  public getHoverObservable(componentId: string): Observable<HoverState> {
    return this.getOrCreateSubject(componentId).asObservable();
  }

  public setHoverState(componentId: string, isHovered: boolean, event?: MouseEvent): void {
    const subject = this.getOrCreateSubject(componentId);
    subject.next({ isHovered, event, componentId });
  }

  public removeHoverObservable(componentId: string): void {
    const subject = this.hoverSubjects.get(componentId);
    if (subject) {
      subject.complete();
      this.hoverSubjects.delete(componentId);
    }
  }

  public hasHoverObservable(componentId: string): boolean {
    return this.hoverSubjects.has(componentId);
  }

  public clearAllHoverStates(): void {
    this.hoverSubjects.forEach((subject, componentId) => {
      subject.next({ isHovered: false, componentId });
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.hoverSubjects.forEach(subject => subject.complete());
    this.hoverSubjects.clear();
  }
}