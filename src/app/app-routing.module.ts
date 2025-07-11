import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'genlv',
        loadComponent: () => import('./second/second.component').then(m => m.SecondComponent)
    },
    {
        path: 'schneider',
        loadComponent: () => import('./schneider/schneider.component').then(m => m.SchneiderComponent)
    },
    {
        path: 'vector-to-graph',
        loadComponent: () => import('./vector-to-graph/vector-to-graph.component').then(m => m.VectorToGraphComponent)
    },
    { path: '', redirectTo: 'genlv', pathMatch: 'full' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
