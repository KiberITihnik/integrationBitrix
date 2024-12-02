<?php

namespace Local\Integrations\RossetiOutage;

use Bitrix\Main\Loader;
use Bitrix\Crm\CompanyTable;
class RossetiOutageService

{
    private const URL = 'https://';
    private const USERNAME = "...";
    private const PASSWORD = '...';
    public function __construct()
    {
        Loader::includeModule('crm');
    }
    public static function getAddress($objectId)
    {

        $companyData = CompanyTable::getList([
            'select' => ['ADDRESS'],
            'filter' => ['=ID' => $objectId],
        ])->fetch();

        return $companyData['ADDRESS'] ?? "Address not found";
    }

    public static function getRequestRossetiOutage($addressParts)
    {
        $curlService = new \Local\Tools\WebService\CurlWebService();
        $curlService->auth(self::USERNAME, self::PASSWORD);
        $curlService->setHeader('Content-Type', 'application/json');

        $fullUrl = self::URL . '?id=' . $addressParts;

        try {
            $response = $curlService->request($fullUrl, [], $curlService::METHOD_GET);
            $statusCode = $curlService->getStatusCode();

            if ($statusCode === 200) {
                return json_decode($response, true);
            } else {
                return ['error' => "Request failed with status code $statusCode", 'response' => json_decode($response, true)];
            }
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }

    public static function filteredRossetiOutage($rossetiOutage): array
    {
        $result = [];

        foreach ($rossetiOutage as $item) {
            $filteredItem = [];
            if (isset($item['outage_id'])) {
                $filteredItem['outage_id'] = $item['outage_id'];
            }
            $filteredItem['outage_vid_otkl'] = $item['outage_vid_otkl'];
            $filteredItem['outage_dat_p'] = $item['outage_dat_p'];
            $filteredItem['outage_dat_vp_plan'] = $item['outage_dat_vp_plan'];

            if (!empty($filteredItem)) {
                $result[] = $filteredItem;
            }
        }

        return $result;
    }

}