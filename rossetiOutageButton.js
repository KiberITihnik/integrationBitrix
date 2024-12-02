class RossetiButtonManager {
    constructor(elementSelector, buttonText, ajaxUrl, ajaxData, targetPath) {
        this.elementSelector = elementSelector;
        this.buttonText = buttonText;
        this.ajaxUrl = ajaxUrl;
        this.targetPath = targetPath;
        this.retryInterval = 50; // Интервал между попытками в мс
        this.maxRetries = 10; // Максимальное количество попыток
    }

    init() {
        BX.ready(() => {
            if (this.isCorrectUrl()) {
                this.addButton();
            } else {
                console.error("URL не соответствует требованиям для выполнения скрипта.");
            }
        });
    }
    isCorrectUrl() {
        const currentUrl = window.location.href;
        const params = new URLSearchParams(window.location.search);

        return (
            currentUrl.slice(this.targetPath) &&
            params.get('IFRAME') === 'Y' &&
            params.get('IFRAME_TYPE') === 'SIDE_SLIDER'
        );
    }

    addButton() {
        this.findElementWithRetry(this.elementSelector, this.maxRetries, this.retryInterval)
            .then((element) => {
                if (element) {
                    const button = this.createButton();
                    element.appendChild(button.render());
                }
            })
            .catch(() => {
                console.error("Не удалось найти элемент с селектором. Поиск промисом , 10 попыток по 50мс:", this.elementSelector);
            });
    }

    //Поиск нужного селектора, 10 попыток по 50мс
    findElementWithRetry(selector, maxRetries, interval) {
        return new Promise((resolve, reject) => {
            let attempt = 0;

            const intervalId = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(intervalId);
                    resolve(element);
                } else if (attempt >= maxRetries) {
                    clearInterval(intervalId);
                    reject();
                }
                attempt++;
            }, interval);
        });
    }

    createButton() {
        return new BX.UI.Button({
            text: this.buttonText,
            color: BX.UI.Button.Color.PRIMARY,
            onclick: () => this.handleButtonClick()
        });
    }
    handleButtonClick() {
        this.sendAjaxRequest();
    }

    sendAjaxRequest() {
        const element = document.querySelector(this.elementSelector);

        if (!element) {
            console.error("Элемент для отображения крутилки не найден.");
            return;
        }

        const loader = BX.showWait(element);

        BX.ajax({
            url: this.ajaxUrl,
            method: 'POST',
            dataType: 'json',
            data: {
                objectId: this.getObjectIdFromUrl(),
                sessid: BX.bitrix_sessid()
            },
            onsuccess: (response) => {
                BX.closeWait(element, loader);
                this.handleAjaxSuccess(response);
            },
            onfailure: (error) => {
                BX.closeWait(element, loader);
                this.handleAjaxFailure(error);
            }
        });
    }
    handleAjaxSuccess(response) {
        console.log("Ответ от сервера:", response);
        if (response.success && Array.isArray(response.rossetiOutage)) {
            this.showPopupWithMultipleOutages(response.rossetiOutage);
        } else {
            this.showMessageBox();
        }
    }
    handleAjaxFailure(error) {
        console.error("Ошибка при выполнении запроса:", error);
        this.showMessageBox();
    }

    showMessageBox() {

        const messageContent = `
        <div style="font-size: 14px; line-height: 1.2;">
            Нет данных о отключениях. <br>
            Отключение также посмотреть непосредственно на сайте Россетей ссылка:<br>  
            <a href="https://rosseti-ural.ru/client/informaciya-ob-otklyucheniyah/" target="_blank" style="color: #0a76b7; text-decoration: underline;">
                https://rosseti-ural.ru/client/informaciya-ob-отключениях/
            </a>.
        </div>
    `;

        BX.UI.Dialogs.MessageBox.show({
            title: "Ошибка",
            message: messageContent,
            buttons: BX.UI.Dialogs.MessageBoxButtons.OK,
            modal: true,
        });
    }
    showPopupWithMultipleOutages(outages) {

        const outagesHtml = outages.map((outage, index) => {
            const plannedOutageTime = outage.outage_dat_p || "——";
            const estimatedRestorationTime = outage.outage_dat_vp_plan || "——";

            return `
            <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ccc;">
                <div style="flex: 1; text-align: center; border-right: 1px solid #ccc; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="align-self: flex-start;"><strong>Плановое время начала отключения</strong></div>
                    <div style="margin-top: 10px;">${plannedOutageTime}</div>
                </div>
                <div style="flex: 1; text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="align-self: flex-start;"><strong>Ориентировочное время восстановления электроснабжения (местное)</strong></div>
                    <div style="margin-top: 10px;">${estimatedRestorationTime}</div>
                </div>
            </div>
        `;
        }).join('');

        const popupContent = `
        <div style="overflow-y: auto;">
            ${outagesHtml}
        </div>
    `;

        BX.UI.Dialogs.MessageBox.show({
            title: "Информация об отключениях",
            message: popupContent,
            buttons: BX.UI.Dialogs.MessageBoxButtons.OK,
            modal: true,
            maxWidth: 600,
        });
    }

    getObjectIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        const index = pathParts.indexOf("details");
        if (index !== -1 && pathParts[index + 1]) {
            return pathParts[index + 1];
        }
        return null;
    }
}

const buttonManager = new RossetiButtonManager(
    '[data-cid="UF_KRATKOE_NAME_SETEVOI_ORGANIZACII"]',
    "Проверить отключение",
    '/local/lib/ajax/getOutageRosseti.php',
    "/crm/company/details/"
);
buttonManager.init();