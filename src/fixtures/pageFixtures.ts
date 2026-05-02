import { test as base, type Page } from '@playwright/test';
import { ABTestPage } from '../pages/ABTestPage.js';
import { AddRemoveElementsPage } from '../pages/AddRemoveElementsPage.js';
import { BasicAuthPage } from '../pages/BasicAuthPage.js';
import { BrokenImagesPage } from '../pages/BrokenImagesPage.js';
import { ChallengingDomPage } from '../pages/ChallengingDomPage.js';
import { CheckboxesPage } from '../pages/CheckboxesPage.js';
import { ContextMenuPage } from '../pages/ContextMenuPage.js';
import { DigestAuthPage } from '../pages/DigestAuthPage.js';
import { DisappearingElementsPage } from '../pages/DisappearingElementsPage.js';
import { DragAndDropPage } from '../pages/DragAndDropPage.js';
import { DropdownPage } from '../pages/DropdownPage.js';
import { DynamicContentPage } from '../pages/DynamicContentPage.js';
import { DynamicControlsPage } from '../pages/DynamicControlsPage.js';
import { DynamicLoadingPage } from '../pages/DynamicLoadingPage.js';
import { EntryAdPage } from '../pages/EntryAdPage.js';
import { ExitIntentPage } from '../pages/ExitIntentPage.js';
import { FileDownloadPage } from '../pages/FileDownloadPage.js';
import { FileUploadPage } from '../pages/FileUploadPage.js';
import { FloatingMenuPage } from '../pages/FloatingMenuPage.js';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage.js';
import { FramesPage, IFramePage } from '../pages/FramesPage.js';
import { GeolocationPage } from '../pages/GeolocationPage.js';
import { HomePage } from '../pages/HomePage.js';
import { HorizontalSliderPage } from '../pages/HorizontalSliderPage.js';
import { HoversPage } from '../pages/HoversPage.js';
import { InfiniteScrollPage } from '../pages/InfiniteScrollPage.js';
import { InputsPage } from '../pages/InputsPage.js';
import { JqueryUiMenuPage } from '../pages/JqueryUiMenuPage.js';
import { JsAlertsPage } from '../pages/JsAlertsPage.js';
import { JsErrorPage } from '../pages/JsErrorPage.js';
import { KeyPressesPage } from '../pages/KeyPressesPage.js';
import { LargeAndDeepDomPage } from '../pages/LargeAndDeepDomPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { MultipleWindowsPage } from '../pages/MultipleWindowsPage.js';
import { NestedFramesPage } from '../pages/NestedFramesPage.js';
import { NotificationMessagePage } from '../pages/NotificationMessagePage.js';
import { RedirectorPage } from '../pages/RedirectorPage.js';
import { SecureFileDownloadPage } from '../pages/SecureFileDownloadPage.js';
import { ShadowDomPage } from '../pages/ShadowDomPage.js';
import { ShiftingContentPage } from '../pages/ShiftingContentPage.js';
import { SlowResourcesPage } from '../pages/SlowResourcesPage.js';
import { SortableDataTablesPage } from '../pages/SortableDataTablesPage.js';
import { StatusCodesPage } from '../pages/StatusCodesPage.js';
import { TyposPage } from '../pages/TyposPage.js';
import { WysiwygEditorPage } from '../pages/WysiwygEditorPage.js';

type PageCtor<T> = new (page: Page) => T;

const make =
  <T>(Klass: PageCtor<T>) =>
  async (
    { page }: { page: Page },
    use: (value: T) => Promise<void>,
  ): Promise<void> => use(new Klass(page));

interface PageFixtures {
  abTestPage: ABTestPage;
  addRemoveElementsPage: AddRemoveElementsPage;
  basicAuthPage: BasicAuthPage;
  brokenImagesPage: BrokenImagesPage;
  challengingDomPage: ChallengingDomPage;
  checkboxesPage: CheckboxesPage;
  contextMenuPage: ContextMenuPage;
  digestAuthPage: DigestAuthPage;
  disappearingElementsPage: DisappearingElementsPage;
  dragAndDropPage: DragAndDropPage;
  dropdownPage: DropdownPage;
  dynamicContentPage: DynamicContentPage;
  dynamicControlsPage: DynamicControlsPage;
  dynamicLoadingPage: DynamicLoadingPage;
  entryAdPage: EntryAdPage;
  exitIntentPage: ExitIntentPage;
  fileDownloadPage: FileDownloadPage;
  fileUploadPage: FileUploadPage;
  floatingMenuPage: FloatingMenuPage;
  forgotPasswordPage: ForgotPasswordPage;
  framesPage: FramesPage;
  iframePage: IFramePage;
  geolocationPage: GeolocationPage;
  homePage: HomePage;
  horizontalSliderPage: HorizontalSliderPage;
  hoversPage: HoversPage;
  infiniteScrollPage: InfiniteScrollPage;
  inputsPage: InputsPage;
  jqueryUiMenuPage: JqueryUiMenuPage;
  jsAlertsPage: JsAlertsPage;
  jsErrorPage: JsErrorPage;
  keyPressesPage: KeyPressesPage;
  largeAndDeepDomPage: LargeAndDeepDomPage;
  loginPage: LoginPage;
  multipleWindowsPage: MultipleWindowsPage;
  nestedFramesPage: NestedFramesPage;
  notificationMessagePage: NotificationMessagePage;
  redirectorPage: RedirectorPage;
  secureFileDownloadPage: SecureFileDownloadPage;
  shadowDomPage: ShadowDomPage;
  shiftingContentPage: ShiftingContentPage;
  slowResourcesPage: SlowResourcesPage;
  sortableDataTablesPage: SortableDataTablesPage;
  statusCodesPage: StatusCodesPage;
  typosPage: TyposPage;
  wysiwygEditorPage: WysiwygEditorPage;
}

export const test = base.extend<PageFixtures>({
  abTestPage: make(ABTestPage),
  addRemoveElementsPage: make(AddRemoveElementsPage),
  basicAuthPage: make(BasicAuthPage),
  brokenImagesPage: make(BrokenImagesPage),
  challengingDomPage: make(ChallengingDomPage),
  checkboxesPage: make(CheckboxesPage),
  contextMenuPage: make(ContextMenuPage),
  digestAuthPage: make(DigestAuthPage),
  disappearingElementsPage: make(DisappearingElementsPage),
  dragAndDropPage: make(DragAndDropPage),
  dropdownPage: make(DropdownPage),
  dynamicContentPage: make(DynamicContentPage),
  dynamicControlsPage: make(DynamicControlsPage),
  dynamicLoadingPage: make(DynamicLoadingPage),
  entryAdPage: make(EntryAdPage),
  exitIntentPage: make(ExitIntentPage),
  fileDownloadPage: make(FileDownloadPage),
  fileUploadPage: make(FileUploadPage),
  floatingMenuPage: make(FloatingMenuPage),
  forgotPasswordPage: make(ForgotPasswordPage),
  framesPage: make(FramesPage),
  iframePage: make(IFramePage),
  geolocationPage: make(GeolocationPage),
  homePage: make(HomePage),
  horizontalSliderPage: make(HorizontalSliderPage),
  hoversPage: make(HoversPage),
  infiniteScrollPage: make(InfiniteScrollPage),
  inputsPage: make(InputsPage),
  jqueryUiMenuPage: make(JqueryUiMenuPage),
  jsAlertsPage: make(JsAlertsPage),
  jsErrorPage: make(JsErrorPage),
  keyPressesPage: make(KeyPressesPage),
  largeAndDeepDomPage: make(LargeAndDeepDomPage),
  loginPage: make(LoginPage),
  multipleWindowsPage: make(MultipleWindowsPage),
  nestedFramesPage: make(NestedFramesPage),
  notificationMessagePage: make(NotificationMessagePage),
  redirectorPage: make(RedirectorPage),
  secureFileDownloadPage: make(SecureFileDownloadPage),
  shadowDomPage: make(ShadowDomPage),
  shiftingContentPage: make(ShiftingContentPage),
  slowResourcesPage: make(SlowResourcesPage),
  sortableDataTablesPage: make(SortableDataTablesPage),
  statusCodesPage: make(StatusCodesPage),
  typosPage: make(TyposPage),
  wysiwygEditorPage: make(WysiwygEditorPage),
});

export { expect } from '@playwright/test';
