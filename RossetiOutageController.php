<?php

namespace Local\Integrations\RossetiOutage;

use Local\Integrations\RossetiOutage\RossetiOutageService,
    Local\Integrations\DataLake\DataLakeIntegration;
class RossetiOutageController
{
    private $rossetiOutageService;
    private $objectId;

    public function __construct($objectId)
    {
        $this->rossetiOutageService = new RossetiOutageService();
        $this->objectId = $objectId;
    }

    public function processRequest()
    {
        $address = $this->rossetiOutageService->getAddress($this->objectId);
        try {
            $integration = new DataLakeIntegration();
            $addressParts = $integration->getAddressPartFromLake($address);

            if ($addressParts) {
                $rossetiOutage = $this->rossetiOutageService->getRequestRossetiOutage($addressParts['object_id']);

                if (empty($rossetiOutage['result']))
                    return [];

                $filteredRossetiOutage = $this->rossetiOutageService->filteredRossetiOutage($rossetiOutage['result']);

                return $filteredRossetiOutage;
            }
        } catch (\Exception $e) {
            return htmlspecialchars($e->getMessage());
        }
        return '';
    }
}
