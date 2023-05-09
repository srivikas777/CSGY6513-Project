import React from 'react';
import {useDrop, useDrag, DragSourceMonitor} from 'react-dnd';
import {DndProvider} from 'react-dnd';
import Backend from 'react-dnd-html5-backend';
import {ColumnBadge, BadgeGroup, BadgeButton} from '../Badges/Badges';
import {
  SearchResult,
  ColumnMetadata,
  ColumnAggregations,
} from '../../api/types';
import {FunctionBin} from './FunctionBin';

const ItemType = 'badge';

const NUMBER_AGG_FUNCTIONS = ['first', 'mean', 'sum', 'max', 'min', 'count'];
const STRING_AGG_FUNCTIONS = ['first', 'count'];
const ALL_AGG_FUNCTIONS = '_all';

const badgeBinStyle = (background: string): React.CSSProperties => ({
  border: '1px solid #c0c0c0',
  padding: '.25rem',
  minHeight: '100px',
  backgroundColor: background,
});

interface BadgeBinProps {
  uniqueBinId: string;
  columns?: AggColumn[];
  onRemoveColumn(aggColumn: AggColumn): void;
}

const BadgeBin: React.FC<BadgeBinProps> = ({
  uniqueBinId,
  columns,
  onRemoveColumn,
}) => {
  const [{canDrop, isOver, column}, drop] = useDrop({
    accept: ItemType,
    // drop: () => ({ name: 'BadgeBin' }),
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      column: monitor.getItem()?.column as ColumnMetadata | null,
    }),
  });

  let background = 'transparent';
  const isActive = canDrop && isOver;
  if (isActive) {
    // green-ish, when badge is over the target bin
    background = '#859f2850';
  } else if (canDrop) {
    // gray-ish, while badge in being dragged toward the target bin
    background = '#f0f0f0';
  }

  const isDragging = column !== null && canDrop;
  const isStringColumn = column && column.structural_type.endsWith('Text');
  const isNumberColumn = column && !column.structural_type.endsWith('Text');
  return (
    <div className="d-flex flex-column">
      <b className="mt-2">Included after merge:</b>
      <span className="small">
        You final dataset with have the following columns in addition to the
        original columns.
      </span>
      <div ref={drop} style={badgeBinStyle(background)}>
        <div className={isDragging ? 'd-flex flex-wrap' : 'd-none'}>
          <div className={isStringColumn ? 'd-flex flex-wrap' : 'd-none'}>
            {STRING_AGG_FUNCTIONS.map(fn => (
              <FunctionBin fn={fn} key={`bin-${uniqueBinId}-fn-${fn}`} />
            ))}
          </div>
          <div className={isNumberColumn ? 'd-flex flex-wrap' : 'd-none'}>
            {NUMBER_AGG_FUNCTIONS.map(fn => (
              <FunctionBin fn={fn} key={`bin-${uniqueBinId}-fn-${fn}`} />
            ))}
          </div>
          <FunctionBin fn={ALL_AGG_FUNCTIONS} label="All functions" />
        </div>
        {isActive ? (
          <span className="small">Release to drop!</span>
        ) : columns && columns.length > 0 ? (
          <BadgeGroup>
            {columns.map((c, i) => (
              <ColumnBadge
                key={`badge-bin-${uniqueBinId}-column-${i}`}
                column={c.column}
                function={c.agg_function}
                cornerButton={BadgeButton.REMOVE}
                onClick={() => onRemoveColumn(c)}
              />
            ))}
          </BadgeGroup>
        ) : (
          <span className="small">
            Drag columns here to include them in the final merged dataset.
          </span>
        )}
      </div>
    </div>
  );
};

interface DraggableBadgeProps {
  column: ColumnMetadata;
  onDrop: (column: ColumnMetadata, aggFunction: string) => void;
}

const DraggableBadge: React.FC<DraggableBadgeProps> = ({column, onDrop}) => {
  const [{isDragging}, drag] = useDrag({
    item: {column, type: ItemType},
    end: (item: ColumnMetadata | undefined, monitor: DragSourceMonitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        onDrop(column, dropResult.name);
      }
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });
  const opacity = isDragging ? 0.4 : 1;
  return (
    <div ref={drag} style={{cursor: 'move', opacity}}>
      <ColumnBadge column={column} />
    </div>
  );
};

interface AggColumn {
  column: ColumnMetadata;
  agg_function: string;
}

interface JoinColumnsSelectorProps {
  hit: SearchResult;
  excludeColumns: string[];
  onChange: (columnAggregations: ColumnAggregations) => void;
}

interface JoinColumnsSelectorState {
  columns: AggColumn[];
}

class JoinColumnsSelector extends React.Component<
  JoinColumnsSelectorProps,
  JoinColumnsSelectorState
> {
  constructor(props: JoinColumnsSelectorProps) {
    super(props);
    this.state = {columns: []};
  }

  addColumn(column: ColumnMetadata, aggFunction: string) {
    this.setState({
      columns: [...this.state.columns, {column, agg_function: aggFunction}],
    });
  }

  updateColumnAggregations(functions: AggColumn[]) {
    const columnAggregations: ColumnAggregations = {};
    functions.forEach(fn => {
      columnAggregations[fn.column.name] =
        columnAggregations[fn.column.name] || [];
      columnAggregations[fn.column.name].push(fn.agg_function);
    });
    return columnAggregations;
  }

  removeColumn(aggColumn: AggColumn) {
    const updatedColumns: AggColumn[] = this.state.columns.filter(
      col =>
        !(
          col.column.name === aggColumn.column.name &&
          col.agg_function === aggColumn.agg_function
        )
    );
    this.setState(
      {
        columns: updatedColumns,
      },
      () => {
        this.props.onChange(this.updateColumnAggregations(updatedColumns));
      }
    );
  }

  unique(functions: AggColumn[]): AggColumn[] {
    const columns: {
      [key: string]: AggColumn;
    } = {};
    functions.forEach(fn => {
      const key = fn.column.name + fn.agg_function;
      columns[key] = fn;
    });
    return Object.values(columns);
  }

  handleDrop(column: ColumnMetadata, aggFunction: string) {
    let functions;
    if (!aggFunction || aggFunction === ALL_AGG_FUNCTIONS) {
      const functionNames = column.structural_type.endsWith('Text')
        ? STRING_AGG_FUNCTIONS // string column
        : NUMBER_AGG_FUNCTIONS; // number column
      functions = functionNames.map(fn => ({column, agg_function: fn}));
    } else {
      functions = [{column, agg_function: aggFunction}];
    }

    functions = this.unique([...this.state.columns, ...functions]);
    const columnAggregations: ColumnAggregations =
      this.updateColumnAggregations(functions);

    this.setState(
      {
        columns: functions,
      },
      () => {
        this.props.onChange(columnAggregations);
      }
    );
  }

  render() {
    const {hit, excludeColumns} = this.props;
    if (!hit.augmentation || hit.augmentation.type === 'none') {
      return null;
    }
    return (
      <DndProvider backend={Backend}>
        <div className="d-flex flex-column">
          <b className="mt-2">Available columns:</b>
          <span className="small">
            Select which columns should be added to the final merged dataset.
          </span>
          <BadgeGroup>
            {hit.metadata.columns
              .filter(c => !excludeColumns.find(j => j === c.name))
              .map((c, i) => (
                <DraggableBadge
                  key={`dragbadge-${i}-${hit.id}`}
                  column={c}
                  onDrop={(c, fn) => this.handleDrop(c, fn)}
                />
              ))}
          </BadgeGroup>
          <BadgeBin
            columns={this.state.columns}
            uniqueBinId={hit.id}
            onRemoveColumn={c => this.removeColumn(c)}
          />
        </div>
      </DndProvider>
    );
  }
}

export {JoinColumnsSelector};
