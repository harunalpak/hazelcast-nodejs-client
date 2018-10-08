/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var expect = require('chai').expect;
var Promise = require('bluebird');

var RC = require('../RC');
var Client = require('../../').Client;
var Util = require('../Util');
var Config = require('../../').Config;
var BuildInfoLoader = require('../../lib/BuildInfoLoader').BuildInfoLoader;


describe('Statistics with default period', function () {

    var cluster;
    var client;
    var map;
    var member;

    before(function () {
        return RC.createCluster(null, null).then(function (res) {
            cluster = res;
        }).then(function () {
            return RC.startMember(cluster.id);
        }).then(function (m) {
            member = m;
            var cfg = new Config.ClientConfig();
            var ncc = new Config.NearCacheConfig();
            ncc.name = 'nearCachedMap*';
            ncc.invalidateOnChange = false;
            cfg.nearCacheConfigs['nearCachedMap*'] = ncc;
            cfg.properties['hazelcast.client.statistics.enabled'] = true;
            return Client.newHazelcastClient(cfg);
        }).then(function (cl) {
            client = cl;
            return client.getMap('nearCachedMap1').then(function (mp) {
                map = mp;
            });
        });
    });

    after(function () {
        map.destroy();
        client.shutdown();
        RC.shutdownCluster(cluster.id);
    });

    it('should be enabled via configuration', function () {
        return Util.promiseWaitMilliseconds(1000).then(function () {
            return getClientStatisticsFromServer(cluster);
        }).then(function (stats) {
            expect(stats).to.not.equal('');
        });
    });

    it('should contain statistics content', function () {
        return Util.promiseWaitMilliseconds(1000).then(function () {
            return getClientStatisticsFromServer(cluster);
        }).then(function (stats) {
            expect(stats).to.not.be.null;
            expect(contains(stats, 'clientName=' + client.getName())).to.be.true;
            expect(contains(stats, 'lastStatisticsCollectionTime=')).to.be.true;
            expect(contains(stats, 'enterprise=false')).to.be.true;
            expect(contains(stats, 'clientType=NodeJS')).to.be.true;
            expect(contains(stats, 'clientVersion=' + BuildInfoLoader.getClientVersion())).to.be.true;

            var ownerConnection = client.getClusterService().getOwnerConnection();
            expect(contains(stats, 'clusterConnectionTimestamp=' + ownerConnection.getStartTime())).to.be.true;
            expect(contains(stats, 'clientAddress=' + ownerConnection.getLocalAddress().toString())).to.be.true;
            expect(contains(stats, 'os.committedVirtualMemorySize=')).to.be.true;
            expect(contains(stats, 'os.freeSwapSpaceSize=')).to.be.true;
            expect(contains(stats, 'os.maxFileDescriptorCount=')).to.be.true;
            expect(contains(stats, 'os.openFileDescriptorCount=')).to.be.true;
            expect(contains(stats, 'os.processCpuTime=')).to.be.true;
            expect(contains(stats, 'os.systemLoadAverage=')).to.be.true;
            expect(contains(stats, 'os.totalPhysicalMemorySize=')).to.be.true;
            expect(contains(stats, 'os.totalSwapSpaceSize=')).to.be.true;
            expect(contains(stats, 'runtime.availableProcessors=')).to.be.true;
            expect(contains(stats, 'runtime.freeMemory=')).to.be.true;
            expect(contains(stats, 'runtime.maxMemory=')).to.be.true;
            expect(contains(stats, 'runtime.totalMemory=')).to.be.true;
            expect(contains(stats, 'runtime.uptime=')).to.be.true;
            expect(contains(stats, 'runtime.usedMemory=')).to.be.true;
            expect(contains(stats, 'executionService.userExecutorQueueSize=')).to.be.true;
        });


    });

    it('should contain near cache statistics content', function () {
        return map.put('key', 'value').then(function () {
            return map.get('key');
        }).then(function () {
            return map.get('key');
        }).then(function () {
            return Util.promiseWaitMilliseconds(5000);
        }).then(function () {
            return getClientStatisticsFromServer(cluster);
        }).then(function (stats) {
            expect(contains(stats, 'nc.nearCachedMap1.hits=1')).to.be.true;
            expect(contains(stats, 'nc.nearCachedMap1.creationTime=')).to.be.true;
            expect(contains(stats, 'nc.nearCachedMap1.misses=1')).to.be.true;
            expect(contains(stats, 'nc.nearCachedMap1.ownedEntryCount=1')).to.be.true;
        });
    });

    function contains(base, search) {
        var firstIndex = base.indexOf(search);
        return firstIndex > -1 && firstIndex == base.lastIndexOf(search);
    }

});

describe('Statistics with non-default period', function () {
    var cluster;
    var client;

    before(function () {
        return RC.createCluster(null, null).then(function (res) {
            cluster = res;
        }).then(function () {
            return RC.startMember(cluster.id);
        }).then(function () {
            var cfg = new Config.ClientConfig();
            cfg.properties['hazelcast.client.statistics.enabled'] = true;
            cfg.properties['hazelcast.client.statistics.period.seconds'] = 2;
            return Client.newHazelcastClient(cfg);
        }).then(function (cl) {
            client = cl;
        });
    });


    after(function () {
        client.shutdown();
        RC.shutdownCluster(cluster.id);
    });

    it('should not change before period', function () {
        var stats1;
        return Util.promiseWaitMilliseconds(1000).then(function () {
            return getClientStatisticsFromServer(cluster);
        }).then(function (st) {
            stats1 = st;
            return getClientStatisticsFromServer(cluster)
        }).then(function (stats2) {
            expect(stats1).to.be.equal(stats2);
        });
    });

    it('should change after period', function () {
        var stats1;
        return Util.promiseWaitMilliseconds(1000).then(function () {
            return getClientStatisticsFromServer(cluster);
        }).then(function (st) {
            stats1 = st;
            return Util.promiseWaitMilliseconds(2000)
        }).then(function () {
            return getClientStatisticsFromServer(cluster);
        }).then(function (stats2) {
            expect(stats1).not.to.be.equal(stats2);
        });
    });
});

describe('Statistics with negative period', function () {
    var client;
    var cluster;

    before(function () {
        return RC.createCluster(null, null).then(function (res) {
            cluster = res;
        }).then(function () {
            return RC.startMember(cluster.id);
        }).then(function () {
            var cfg = new Config.ClientConfig();
            cfg.properties['hazelcast.client.statistics.enabled'] = true;
            cfg.properties['hazelcast.client.statistics.period.seconds'] = -2;
            return Client.newHazelcastClient(cfg);
        }).then(function (cl) {
            client = cl;
        });
    });

    after(function () {
        client.shutdown();
        RC.shutdownCluster(cluster.id);
    });

    it('should be enabled via configuration', function () {
        return Util.promiseWaitMilliseconds(1000).then(function () {
            return getClientStatisticsFromServer(cluster);
        }).then(function (stats) {
            expect(stats).to.not.equal('');
        });
    });
});

function getClientStatisticsFromServer(cluster) {
    var deferred = Promise.defer();
    var script = 'client0=instance_0.getClientService().getConnectedClients().' +
        'toArray()[0]\nresult=client0.getClientStatistics();';
    RC.executeOnController(cluster.id, script, 1).then(function (response) {
        if (response.result != null) {
            return deferred.resolve(response.result.toString());
        }
        return deferred.resolve(null);
    });

    return deferred.promise;
}
