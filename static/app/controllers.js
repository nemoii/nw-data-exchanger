angular.module('NWDEControllers', [])
	.controller('BaseController', ['$scope', function ($scope) {
		$scope.fullWidth = $(window).width() < 1366;
		$scope.toggleWidth = function () {
			$scope.fullWidth = !$scope.fullWidth;
		};
	}])
	.controller('NewConfigController', ['$scope', '$state', function ($scope, $state) {
		$scope.cfg = {
			src: { 
				connInfo: {}, 
				tables: {}, 
				columns: {},
				from: 'src', 
				to: 'dst'
			},
			dst: { 
				connInfo: {}, 
				tables: {}, 
				columns: {},
				from: 'dst', 
				to: 'src'
			}
		};

		$scope.$on('$stateChangeSuccess', function () {
			$scope.progress = $state.current.progress;
		});
	}])
	.controller('NewConfigMainController', ['$scope', function ($scope) {
		$scope.svg = {
			showCount: 0,
			height: 0,
			srcHeight: 0,
			dstHeight: 0,
			lines: {},
			genFromColumns: function () {
				for (var column in $scope.cfg.src.tables[$scope.cfg.src.selectedTable].cols) {
					var col = $scope.cfg.src.tables[$scope.cfg.src.selectedTable].cols[column];

					$scope.svg.lines['dst' + $scope.cfg.src.tables[$scope.cfg.src.selectedTable].linkedTable + col.linkedColumn + ':src' + $scope.cfg.src.selectedTable + column] = {
						start: col.index,
						end: $scope.cfg.dst.tables[$scope.cfg.src.tables[$scope.cfg.src.selectedTable].linkedTable].cols[col.linkedColumn].index
					};
				}
			},
			genFromTables: function () {
				for (var table in $scope.cfg.src.tables) {
					var linkedTable = $scope.cfg.src.tables[table].linkedTable;

					$scope.svg.lines['dst' + linkedTable + ':src' + table] = {
						start: $scope.cfg.src.tables[table].index,
						end: $scope.cfg.dst.tables[linkedTable].index
					};
				}
			},
			join: function () {
				$scope.svg.showCount++;
				$scope.svg.lines = {};
				if ($scope.svg.showCount >= 2) $scope.svg.genFromColumns();
				return this;
			},
			leave: function () {
				$scope.svg.showCount--;
				$scope.svg.lines = {};
				if ($scope.svg.showCount == 0) $scope.svg.genFromTables();
				return this;
			},
			add: function (id, left, right) {
				$scope.svg.lines[id] = {
					start: left,
					end: right
				};
				return this;
			},
			remove: function (id) {
				delete $scope.svg.lines[id];
				return this;
			}
		};

		$scope.onResize = function (width, height, who) {
			$scope.svg[who + 'Height'] = height;
			$scope.svg.height = Math.max($scope.svg.srcHeight, $scope.svg.dstHeight);
			$scope.$apply();
		};

		$scope.autoLink = function () {
			if ($scope.svg.showCount < 2) return;

			$scope.cfg.src.columns[$scope.cfg.src.selectedTable].forEach(function (col) {
				
			});
		};
		
		$scope.clearSelection = function () {
			$scope.$broadcast('clearSelection');
		}

		$scope.$on('linkColumn', function (e, col1, col2) {
			$scope.cfg[col1.of].tables[col1.table].cols[col1.column] = $.extend({
				linkedColumn: col2.column
			}, col1);
			$scope.cfg[col2.of].tables[col2.table].cols[col2.column] = $.extend({
				linkedColumn: col1.column
			}, col2);
			$scope.svg.add([col1.of + col1.table + col1.column, col2.of + col2.table + col2.column].sort().join(':'),
				col1.of == 'src' ? col1.index : col2.index,
				col2.of == 'src' ? col1.index : col2.index
			);

			e.targetScope.$apply();
			e.stopPropagation();
		});

		$scope.$on('unlinkColumn', function (e, who, table, column) {
			var linkedColumn = $scope.cfg[who].tables[table].cols[column].linkedColumn;
			delete $scope.cfg[who].tables[table].cols[column];
			delete $scope.cfg[$scope.cfg[who].to].tables[$scope.cfg[who].tables[table].linkedTable].cols[linkedColumn];
			$scope.svg.remove([who + table + column, $scope.cfg[who].to + $scope.cfg[who].tables[table].linkedTable + linkedColumn].sort().join(':'));

			e.stopPropagation();
			$scope.$broadcast('configChanged');
		});

		$scope.$on('linkTable', function (e, table1, table2) {
			$scope.cfg[table1.of].tables[table1.table].linkedTable = table2.table;
			$scope.cfg[table2.of].tables[table2.table].linkedTable = table1.table;
			$scope.cfg[table1.of].tables[table1.table].index = table1.index;
			$scope.cfg[table2.of].tables[table2.table].index = table2.index;
			
			e.stopPropagation();
			e.targetScope.$apply();
		});

		$scope.$on('unlinkTable', function (e, who, table) {
			$scope.svg.remove([who + table, $scope.cfg[who].to + $scope.cfg[who].tables[table].linkedTable].sort().join(':'));
			delete $scope.cfg[$scope.cfg[who].to].tables[$scope.cfg[who].tables[table].linkedTable];
			delete $scope.cfg[who].tables[table];

			e.stopPropagation();
			$scope.$broadcast('configChanged');
		});

		$scope.$on('editSelected', function (e, who, table) {
			$scope.cfg[$scope.cfg[who].to].selectedTable = $scope.cfg[who].tables[table].linkedTable;
			$scope.cfg[who].selectedTable = table;

			e.stopPropagation();
			$scope.$broadcast('configChanged');
			$scope.svg.join().join();
		});
	}]);