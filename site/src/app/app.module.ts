import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MaterialModule } from './material-module';
import { LongPress } from './long-press.directive';
import iro from '@jaames/iro';

import { AppComponent, LocationDialog, PresetDialog } from './app.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  declarations: [
    LongPress,
    AppComponent,
    LocationDialog,
    PresetDialog
  ],
  entryComponents: [LocationDialog, PresetDialog],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
