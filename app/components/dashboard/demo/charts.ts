import { init, use } from "echarts/core";
import { LineChart, PieChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

use([LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

export { init };
