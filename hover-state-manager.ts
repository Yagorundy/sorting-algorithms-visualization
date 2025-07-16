import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';

export interface HoverState {
  isHovered?: boolean;
  event?: MouseEvent;
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

  public removeHoverObservable(componentId: string) {
    this.hoverSubjects.get(componentId)?.complete();
    this.hoverSubjects.delete(componentId);
  }

  public setHoverState(componentId: string, isHovered: boolean, event?: MouseEvent) {
    const subject = this.getOrCreateSubject(componentId);
    subject.next({ isHovered, event });
  }

  public hasHoverFunctionality(componentId: string): boolean {
    return this.hoverSubjects.has(componentId);
  }

  public destroy(componentId: string) {
    // Note: Original logic returns early if element exists - keeping this for exact compatibility  
    let element = document.querySelector<HTMLElement>(`[id="${componentId}"]`) as HTMLElement;
    if (element) return;
    this.removeHoverObservable(componentId);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    
    // Clean up all hover subjects
    this.hoverSubjects.forEach(subject => subject.complete());
    this.hoverSubjects.clear();
  }
}