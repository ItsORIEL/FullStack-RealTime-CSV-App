import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

const DataViewer = ({ csvData }: { csvData: Record<string, string | number>[] }) => {
  if (!csvData || csvData.length === 0) {
    return (
      <Typography color="textSecondary" align="center" sx={{ padding: 2 }}>
        No data to display
      </Typography>
    );
  }

  const columnHeaders = Object.keys(csvData[0]);

  return (
    <TableContainer component={Paper} sx={{ marginTop: 2 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            {columnHeaders.map((headerName) => (
              <TableCell
                key={headerName}
                sx={{
                  fontWeight: 600,
                  backgroundColor: '#f5f5f5',
                  textTransform: 'uppercase',
                  fontSize: '0.85rem',
                }}
              >
                {headerName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {csvData.map((rowData, rowIndex) => (
            <TableRow
              key={rowIndex}
              sx={{
                '&:hover': {
                  backgroundColor: '#f9f9f9',
                },
              }}
            >
              {columnHeaders.map((headerName) => (
                <TableCell key={`${rowIndex}-${headerName}`}>
                  {String(rowData[headerName])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataViewer;
