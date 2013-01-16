<?php
$database = "birdy915_rpg";
$database_user = "root";
$database_pass = "";
$database_host = "localhost";

//mysql_connect( $database_host, $database_user, $database_pass );
//mysql_select_db( $database );


header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Content-type: application/json');

$name = isset( $_REQUEST['name'] ) ? stripslashes( $_REQUEST['name'] ) : false;

if ( !empty( $_POST ) ) {
	$name = addslashes( $_POST['name'] );
	$data = addslashes( $_POST['data'] );

	//$map = false;
	//$sql = mysql_query("SELECT * FROM maps WHERE name = '$name'");
	//while( $row = mysql_fetch_assoc( $sql ) ){$map = $row;};
	
	$filename = "maps/$name.map";
	$input = fopen( $filename, 'w' );
	fwrite( $input, $data );
	fclose( $input );
}

if ( $name ) {
	$filename = "maps/$name.map";
	$output = fopen( $filename, 'r' );
	echo stripslashes( fread( $output, filesize($filename) ) );
} else {
	echo json_encode( Array( "message" => "No data", "name" => $name ) );
}
?>